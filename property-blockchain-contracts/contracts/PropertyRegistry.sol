// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyRegistry
 * @dev Ye contract Zameen (Land/Property) ko Blockchain (NFT) par register karne, 
 * kharidne-bechne (Buy/Sell) aur Kiraye (Lease) par dene ke liye banaya gaya hai.
 */
contract PropertyRegistry is ERC721URIStorage, AccessControl, ReentrancyGuard {
    
    // ==========================================
    // 🎭 ROLES (Adhikariyo ke Post)
    // ==========================================
    // REGISTRAR: Ye final approval deta hai aur NFT (Deed) generate karta hai.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    // SURVEYOR: Ye zameen ki physical verification (survey) karta hai.
    bytes32 public constant SURVEYOR_ROLE = keccak256("SURVEYOR_ROLE");

    // ==========================================
    // 👤 USER DATA (Profile Data)
    // ==========================================
    // Ye struct user ki basic details save karta hai (Name, Email, Role)
    struct UserProfile {
        string name;
        string email;
        string role;
        bool isRegistered;
    }
    mapping(address => UserProfile) public users;

    // ==========================================
    // ⚙️ CONFIGURATION (Fees & Counters)
    // ==========================================
    uint256 public registrationFee = 0.001 ether; // Property register karne ki fees
    uint256 private _tokenIds;                    // Total kitni property register hui hain

    // ==========================================
    // 📢 EVENTS (Blockchain History ke liye)
    // ==========================================
    event RequestSubmitted(uint256 indexed requestId, address indexed user);
    event PropertyMinted(uint256 indexed tokenId, address indexed owner);
    event PropertySold(uint256 indexed tokenId, address from, address to, uint256 price, uint256 timestamp);
    event PropertyRented(uint256 indexed tokenId, address tenant, uint256 duration, uint256 price, uint256 timestamp);
    event LeaseEnded(uint256 indexed tokenId, address tenant, uint256 timestamp);
    event PropertyStatusChanged(uint256 indexed tokenId, string newStatus, uint256 price);

    // ==========================================
    // 📜 ENUMS (Property Status Options)
    // ==========================================
    enum Status { Pending, Surveyed, Approved, Rejected }
    enum SaleStatus { NotForSale, ForSale, ForLease, Occupied } 

    // ==========================================
    // 🏠 PROPERTY DATA (Main Land Record)
    // ==========================================
    // Ye struct har ek property ka pura kacha-chittha (record) save karta hai
    struct PropertyRequest {
        uint256 id;              // Property ki Unique ID
        address requester;       // Current Malik ka Wallet Address
        string ownerName;        // Malik ka Naam (Jo Deed pe chhapega)
        string ipfsMetadata;     // IPFS Link (Images, Docs)
        string identityRefId;    // Aadhaar ya ID Proof
        string landArea;         // Zameen ka size (e.g., 1200 Sq Ft)
        string landLocation;     // Zameen ka Address
        
        Status status;           // Govt Verification Status (Pending, Approved etc.)
        SaleStatus saleStatus;   // Market Status (Sale pe hai, Lease pe hai ya Private)
        uint256 price;           // Agar Sale pe hai to kitne ETH ki hai
        
        // --- LEASE (Kiraye) KA DATA ---
        uint256 leasePrice;      // Mahine ka kiraya
        uint256 leaseDuration;   // Kitne time ke liye kiraye pe di hai (in seconds)
        uint256 leaseEndTime;    // Kiraya kab khatam hoga (Timestamp)
        address tenant;          // Kirayedar ka Wallet Address
        uint256 requestTime;     // Property kab register hui thi
    }

    mapping(uint256 => PropertyRequest) public requests;

    // Contract Deploy hote hi deployer ko 'Super Admin' bana diya jayega
    constructor() ERC721("IndiaLandRecord", "ILR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        users[msg.sender] = UserProfile("Super Admin", "admin@gov.in", "ADMIN", true);
    }

    // ==========================================
    // 📝 1. REGISTRATION FUNCTIONS (Govt & User)
    // ==========================================
    
    // Naya User ya Officer (Surveyor/Registrar) register karne ke liye
    function registerUser(string memory _name, string memory _email, string memory _role, string memory _secretCode) public {
        require(!users[msg.sender].isRegistered, "Already registered!");

        if (keccak256(bytes(_role)) == keccak256(bytes("SURVEYOR"))) {
             require(keccak256(bytes(_secretCode)) == keccak256(bytes("SURVEY123")), "Invalid Code");
             _grantRole(SURVEYOR_ROLE, msg.sender);
        } else if (keccak256(bytes(_role)) == keccak256(bytes("REGISTRAR"))) {
             require(keccak256(bytes(_secretCode)) == keccak256(bytes("REGISTRAR123")), "Invalid Code");
             _grantRole(REGISTRAR_ROLE, msg.sender);
        }
        users[msg.sender] = UserProfile(_name, _email, _role, true);
    }

    // Nayi Property Register karne ki Application dalne ke liye
    function requestRegistration(
        string memory _ownerName, 
        string memory _ipfsMetadata, 
        string memory _identityRefId, 
        string memory _landArea, 
        string memory _landLocation
    ) public payable nonReentrant {
        require(msg.value >= registrationFee, "Fee too low");
        _tokenIds++;
        
        requests[_tokenIds] = PropertyRequest(
            _tokenIds, msg.sender, _ownerName, _ipfsMetadata, _identityRefId,
            _landArea, _landLocation, Status.Pending, SaleStatus.NotForSale, 
            0, 0, 0, 0, address(0), block.timestamp
        );
        
        emit RequestSubmitted(_tokenIds, msg.sender);
    }

    // Surveyor property ko verify (Surveyed) mark karta hai
    function completeSurvey(uint256 _requestId) public onlyRole(SURVEYOR_ROLE) {
        requests[_requestId].status = Status.Surveyed;
    }

    // Registrar final approval deta hai aur actual NFT (Deed) generate karta hai
    function approveAndMint(uint256 _requestId) public onlyRole(REGISTRAR_ROLE) {
        PropertyRequest storage req = requests[_requestId];
        req.status = Status.Approved;
        _safeMint(req.requester, req.id);
        _setTokenURI(req.id, req.ipfsMetadata);
        emit PropertyMinted(req.id, req.requester);
    }

    // Agar property me koi jhol hai to Registrar reject kar sakta hai
    function rejectRequest(uint256 _requestId) public onlyRole(REGISTRAR_ROLE) {
        require(requests[_requestId].status != Status.Approved, "Cannot reject approved property");
        requests[_requestId].status = Status.Rejected;
    }

    // ==========================================
    // 💰 2. SALE LOGIC (Kharidna & Bechna)
    // ==========================================
    
    // Property ko bechne (Sale) ke liye Market me list karna
    function listPropertyForSale(uint256 _tokenId, uint256 _priceInWei) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        require(requests[_tokenId].status == Status.Approved, "Not Approved");
        
        // 🚨 Anti-Scam: Agar kirayedar reh raha hai to time khatam hone se pehle sale pe nahi laga sakte
        if (requests[_tokenId].saleStatus == SaleStatus.Occupied && requests[_tokenId].tenant != address(0)) {
            require(block.timestamp > requests[_tokenId].leaseEndTime, "Cannot list for sale: Tenant time not over!");
        }

        requests[_tokenId].saleStatus = SaleStatus.ForSale;
        requests[_tokenId].price = _priceInWei;
        
        // Purana lease (kiraye) ka data mita (wipe) rahe hain
        requests[_tokenId].leasePrice = 0;
        requests[_tokenId].leaseDuration = 0;
        requests[_tokenId].leaseEndTime = 0;
        requests[_tokenId].tenant = address(0);
        
        emit PropertyStatusChanged(_tokenId, "For Sale", _priceInWei);
    }

    // Koi dusra user ETH dekar property kharidta hai
    function buyProperty(uint256 _tokenId, string memory _newOwnerName) public payable nonReentrant {
        PropertyRequest storage prop = requests[_tokenId];
        address seller = ownerOf(_tokenId);

        require(prop.saleStatus == SaleStatus.ForSale, "Not for sale");
        require(msg.value >= prop.price, "Low Balance");
        require(msg.sender != seller, "Cannot buy own");

        // 1. Pura paisa purane malik ko transfer karo
        payable(seller).transfer(msg.value);

        // 2. NFT (Property) naye malik ko transfer karo
        _transfer(seller, msg.sender, _tokenId); 

        // 3. Naye Malik ka naam Property record me daal do
        prop.ownerName = _newOwnerName; 
        prop.requester = msg.sender; 
        
        // 4. Market se hata do (Not For Sale) aur sab kuch Reset kar do
        prop.saleStatus = SaleStatus.NotForSale;
        prop.price = 0;
        prop.leasePrice = 0;     
        prop.leaseDuration = 0;  
        prop.leaseEndTime = 0;
        prop.tenant = address(0);

        emit PropertySold(_tokenId, seller, msg.sender, msg.value, block.timestamp);
    }

    // ==========================================
    // 🔑 3. LEASE LOGIC (Kiraye par Dena)
    // ==========================================
    
    // Property ko Lease (Kiraye) ke liye Market me list karna
    function listPropertyForLease(uint256 _tokenId, uint256 _leasePrice, uint256 _durationSeconds) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        
        // 🚨 Anti-Scam: Time over hone se pehle wapas lease pe nahi laga sakte
        if (requests[_tokenId].saleStatus == SaleStatus.Occupied && requests[_tokenId].tenant != address(0)) {
            require(block.timestamp > requests[_tokenId].leaseEndTime, "Cannot re-list: Tenant time not over!");
        }
        
        requests[_tokenId].saleStatus = SaleStatus.ForLease;
        requests[_tokenId].leasePrice = _leasePrice;
        requests[_tokenId].leaseDuration = _durationSeconds;
        requests[_tokenId].price = 0; 
        
        // Naye kirayedar ke aane ke liye purane kirayedar ka data hatao
        requests[_tokenId].tenant = address(0);
        requests[_tokenId].leaseEndTime = 0;
        
        emit PropertyStatusChanged(_tokenId, "For Lease", _leasePrice);
    }

    // Koi user ETH dekar property kiraye par leta hai
    function rentProperty(uint256 _tokenId) public payable nonReentrant {
        PropertyRequest storage prop = requests[_tokenId];
        address owner = ownerOf(_tokenId);

        require(prop.saleStatus == SaleStatus.ForLease, "Not for lease");
        require(msg.value >= prop.leasePrice, "Insufficient Rent");
        require(msg.sender != owner, "Owner cant rent");

        // Double check: Property khali hai ya nahi
        if (prop.tenant != address(0)) {
            require(block.timestamp > prop.leaseEndTime, "Property Occupied!");
        }

        // Paisa Malik ko bhejo
        payable(owner).transfer(msg.value);

        // Naye kirayedar ki entry aur time chalu
        prop.tenant = msg.sender;
        prop.leaseEndTime = block.timestamp + prop.leaseDuration;
        prop.saleStatus = SaleStatus.Occupied;

        emit PropertyRented(_tokenId, msg.sender, prop.leaseDuration, msg.value, block.timestamp);
    }

    // Property ko market se hatana (Unlist/Private karna)
    function makePropertyPrivate(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Only Owner can unlist!");
        
        // 🚨 Anti-Scam: Jabardasti tenant ko evict nahi kar sakte
        if (requests[_tokenId].saleStatus == SaleStatus.Occupied && requests[_tokenId].tenant != address(0)) {
            require(block.timestamp > requests[_tokenId].leaseEndTime, "Cannot unlist: Lease is active!");
        }

        requests[_tokenId].saleStatus = SaleStatus.NotForSale;
        requests[_tokenId].price = 0;
        
        // Pura Lease Data Zero (0) kar do
        requests[_tokenId].leasePrice = 0;
        requests[_tokenId].leaseDuration = 0;
        requests[_tokenId].leaseEndTime = 0; 
        requests[_tokenId].tenant = address(0);
        
        emit PropertyStatusChanged(_tokenId, "Private", 0);
    }

    // ==========================================
    // 🛠️ 4. ADMIN & VIEW FUNCTIONS (Data dekhne ke liye)
    // ==========================================
    
    // Registration se aayi hui fees Government (Admin) nikal sakti hai
    function withdrawFunds() public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Dashboard me sabhi properties dikhane ke liye
    function getAllRequests() public view returns (PropertyRequest[] memory) {
        PropertyRequest[] memory allRequests = new PropertyRequest[](_tokenIds);
        for (uint256 i = 1; i <= _tokenIds; i++) {
            allRequests[i - 1] = requests[i];
        }
        return allRequests;
    }

    // Kisi ek property ki details nikalne ke liye (Map par click karne pe)
    function getPropertyDetails(uint256 _tokenId) public view returns (
        uint256 id,
        string memory ownerName,  
        address ownerWallet,
        string memory area,       
        string memory location,
        bool isRented
    ) {
        PropertyRequest memory req = requests[_tokenId];
        address currentOwner = ownerOf(_tokenId); 
        
        return (
            req.id,
            req.ownerName, 
            currentOwner,
            req.landArea,
            req.landLocation,
            (req.tenant != address(0) && block.timestamp < req.leaseEndTime)
        );
    }

    // ERC721 standard function
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}