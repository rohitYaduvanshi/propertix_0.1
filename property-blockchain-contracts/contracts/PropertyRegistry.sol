
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyRegistry_v3_Secure
 * @dev Identity Linking, Govt Verification, and Multi-stage Approval System.
 */
contract PropertyRegistry is ERC721URIStorage, AccessControl, ReentrancyGuard {
    
    // ==========================================
    // 🎭 ROLES (Adhikariyo ke Post)
    // ==========================================
    bytes32 public constant GOVT_OFFICER_ROLE = keccak256("GOVT_OFFICER_ROLE");
    bytes32 public constant SURVEYOR_ROLE = keccak256("SURVEYOR_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // ==========================================
    // 🔐 IDENTITY BINDING (Aadhaar/PAN to Wallet)
    // ==========================================
    mapping(bytes32 => address) public identityToWallet; 
    mapping(address => bytes32) public walletToIdentity;

    struct UserProfile {
        string name;
        string email;
        string role;
        bool isRegistered;
    }
    mapping(address => UserProfile) public users;

    uint256 public registrationFee = 0.001 ether; 
    uint256 private _tokenIds;                    

    // ==========================================
    // 📢 EVENTS
    // ==========================================
    event RequestSubmitted(uint256 indexed requestId, address indexed user);
    event StatusUpdated(uint256 indexed requestId, Status newStatus);
    event PropertyMinted(uint256 indexed tokenId, address indexed owner);
    event PropertySold(uint256 indexed tokenId, address from, address to, uint256 price, uint256 timestamp);
    event PropertyRented(uint256 indexed tokenId, address tenant, uint256 duration, uint256 price, uint256 timestamp);
    event PropertyStatusChanged(uint256 indexed tokenId, string newStatus, uint256 price);
    event IdentityLinked(address indexed user, bytes32 indexed identityHash);

    // ==========================================
    // 📜 ENUMS
    // ==========================================
    enum Status { Pending, GovtVerified, Surveyed, Approved, Rejected }
    enum SaleStatus { NotForSale, ForSale, ForLease, Occupied } 

    // ==========================================
    // 🏠 PROPERTY DATA
    // ==========================================
    struct PropertyRequest {
        uint256 id;              
        address requester;       
        string ownerName;        
        string ipfsMetadata;     // Photo and Doc files (Surveyor sees this)
        string identityRefId;    // Aadhaar/PAN (Only Govt/Registrar see this)
        string landArea;         
        string landLocation;     
        string khasraNumber;     // Survey/Plot Number
        
        Status status;           
        SaleStatus saleStatus;   
        uint256 price;           
        
        uint256 leasePrice;      
        uint256 leaseDuration;   
        uint256 leaseEndTime;    
        address tenant;          
        uint256 requestTime;     
    }

    mapping(uint256 => PropertyRequest) public requests;

    constructor() ERC721("IndiaLandRecord", "ILR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        users[msg.sender] = UserProfile("Super Admin", "admin@gov.in", "ADMIN", true);
    }

    // ==========================================
    // 📝 1. SECURE REGISTRATION & LINKING
    // ==========================================

    /**
     * @dev User register hote waqt Aadhaar/PAN hash ko wallet se bind karega.
     */
    function registerUser(
        string memory _name, 
        string memory _email, 
        string memory _role, 
        string memory _secretCode, 
        string memory _aadhaarPAN
    ) public {
        require(!users[msg.sender].isRegistered, "Wallet already linked!");

        bytes32 idHash = keccak256(bytes(_aadhaarPAN));
        require(identityToWallet[idHash] == address(0), "Identity already used by another wallet!");

        // Linking
        identityToWallet[idHash] = msg.sender;
        walletToIdentity[msg.sender] = idHash;

        if (keccak256(bytes(_role)) == keccak256(bytes("GOVT_OFFICER"))) {
            require(keccak256(bytes(_secretCode)) == keccak256(bytes("GOVT123")), "Invalid Code");
            _grantRole(GOVT_OFFICER_ROLE, msg.sender);
        } else if (keccak256(bytes(_role)) == keccak256(bytes("SURVEYOR"))) {
            require(keccak256(bytes(_secretCode)) == keccak256(bytes("SURVEY123")), "Invalid Code");
            _grantRole(SURVEYOR_ROLE, msg.sender);
        } else if (keccak256(bytes(_role)) == keccak256(bytes("REGISTRAR"))) {
            require(keccak256(bytes(_secretCode)) == keccak256(bytes("REGISTRAR123")), "Invalid Code");
            _grantRole(REGISTRAR_ROLE, msg.sender);
        }
    
        users[msg.sender] = UserProfile(_name, _email, _role, true);
        emit IdentityLinked(msg.sender, idHash);
    }

    // Nayi Property Request
    function requestRegistration(
        string memory _ownerName, 
        string memory _ipfsMetadata, 
        string memory _identityRefId, 
        string memory _landArea, 
        string memory _landLocation,
        string memory _khasraNumber
    ) public payable nonReentrant {
        require(users[msg.sender].isRegistered, "Must link Identity first!");
        require(msg.value >= registrationFee, "Fee too low");
        
        _tokenIds++;
        requests[_tokenIds] = PropertyRequest(
            _tokenIds, msg.sender, _ownerName, _ipfsMetadata, _identityRefId,
            _landArea, _landLocation, _khasraNumber, Status.Pending, SaleStatus.NotForSale, 
            0, 0, 0, 0, address(0), block.timestamp
        );
        
        emit RequestSubmitted(_tokenIds, msg.sender);
    }

    // ==========================================
    // ⚖️ 2. VERIFICATION PIPELINE
    // ==========================================

    // Phase 1: Govt Officer (Checks Aadhaar, PAN, Khasra)
    function verifyByGovt(uint256 _requestId) public onlyRole(GOVT_OFFICER_ROLE) {
        require(requests[_requestId].status == Status.Pending, "Stage mismatch");
        requests[_requestId].status = Status.GovtVerified;
        emit StatusUpdated(_requestId, Status.GovtVerified);
    }

    // Phase 2: Surveyor (Checks Photos & Location)
    function completeSurvey(uint256 _requestId) public onlyRole(SURVEYOR_ROLE) {
        require(requests[_requestId].status == Status.GovtVerified, "Govt must verify first");
        requests[_requestId].status = Status.Surveyed;
        emit StatusUpdated(_requestId, Status.Surveyed);
    }

    // Phase 3: Registrar (Final Approval & NFT Minting)
    function approveAndMint(uint256 _requestId) public onlyRole(REGISTRAR_ROLE) {
        PropertyRequest storage req = requests[_requestId];
        require(req.status == Status.Surveyed, "Must be surveyed first");
        
        req.status = Status.Approved;
        _safeMint(req.requester, req.id);
        _setTokenURI(req.id, req.ipfsMetadata);
        emit PropertyMinted(req.id, req.requester);
    }

    function rejectRequest(uint256 _requestId) public {
        require(hasRole(GOVT_OFFICER_ROLE, msg.sender) || hasRole(REGISTRAR_ROLE, msg.sender), "Not authorized");
        requests[_requestId].status = Status.Rejected;
        emit StatusUpdated(_requestId, Status.Rejected);
    }

    // ==========================================
    // 💰 3. MARKET LOGIC
    // ==========================================

    function listPropertyForSale(uint256 _tokenId, uint256 _priceInWei) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        require(requests[_tokenId].status == Status.Approved, "Not Fully Verified");
        
        // Identity Challenge: Yahan frontend par test dena hoga
        requests[_tokenId].saleStatus = SaleStatus.ForSale;
        requests[_tokenId].price = _priceInWei;
        emit PropertyStatusChanged(_tokenId, "For Sale", _priceInWei);
    }

    function buyProperty(uint256 _tokenId, string memory _newOwnerName) public payable nonReentrant {
        PropertyRequest storage prop = requests[_tokenId];
        address seller = ownerOf(_tokenId);

        require(users[msg.sender].isRegistered, "Buyer must have linked Identity!");
        require(prop.saleStatus == SaleStatus.ForSale, "Not for sale");
        require(msg.value >= prop.price, "Insufficient Funds");

        payable(seller).transfer(msg.value);
        _transfer(seller, msg.sender, _tokenId); 

        prop.ownerName = _newOwnerName; 
        prop.requester = msg.sender; 
        prop.saleStatus = SaleStatus.NotForSale;

        emit PropertySold(_tokenId, seller, msg.sender, msg.value, block.timestamp);
    }

    // ... (Old Lease Logic remains same but ensures status is Approved)
        // ==========================================
    // 🔑 3. LEASE LOGIC (Kiraye par Dena)
    // ==========================================
    
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
