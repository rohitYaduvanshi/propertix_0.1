// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyRegistry_v4_Final
 * @dev 4-Role System: Identity Linking, Govt Verification, Surveyor Audit, and Registrar Minting.
 */
contract PropertyRegistry is ERC721URIStorage, AccessControl, ReentrancyGuard {
    
    // ==========================================
    // 🎭 ROLES (Permissions)
    // ==========================================
    bytes32 public constant GOVT_OFFICER_ROLE = keccak256("GOVT_OFFICER_ROLE");
    bytes32 public constant SURVEYOR_ROLE = keccak256("SURVEYOR_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // ==========================================
    // 🔐 IDENTITY BINDING (Interlinking)
    // ==========================================
    // Aadhaar/PAN hash linked to Wallet
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
    // 📜 ENUMS (Stages)
    // ==========================================
    enum Status { Pending, GovtVerified, Surveyed, Approved, Rejected }
    enum SaleStatus { NotForSale, ForSale, ForLease, Occupied } 

    // ==========================================
    // 🏠 PROPERTY STRUCTURE
    // ==========================================
    struct PropertyRequest {
        uint256 id;              
        address requester;       
        string ownerName;        
        string ipfsMetadata;     
        string identityRefId;    // Aadhaar Hash Reference
        string landArea;         
        string landLocation;     
        string khasraNumber;     
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

    // ==========================================
    // 📢 EVENTS
    // ==========================================
    event RequestSubmitted(uint256 indexed requestId, address indexed user);
    event StatusUpdated(uint256 indexed requestId, Status newStatus);
    event PropertyMinted(uint256 indexed tokenId, address indexed owner);
    event PropertySold(uint256 indexed tokenId, address from, address to, uint256 price);
    event PropertyRented(uint256 indexed tokenId, address tenant, uint256 duration, uint256 price, uint256 timestamp);
    event PropertyStatusChanged(uint256 indexed tokenId, string newStatus, uint256 price);
    event IdentityLinked(address indexed user, bytes32 indexed identityHash);

    // ==========================================
    // 🏗️ CONSTRUCTOR
    // ==========================================
    constructor() ERC721("IndiaLandRecord", "ILR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        users[msg.sender] = UserProfile("Super Admin", "admin@gov.in", "ADMIN", true);
    }

    // ==========================================
    // 📝 1. USER REGISTRATION & IDENTITY LINKING
    // ==========================================

    function registerUser(
        string memory _name, 
        string memory _email, 
        string memory _role, 
        string memory _secretCode, 
        string memory _aadhaarPAN
    ) public {
        require(!users[msg.sender].isRegistered, "Wallet already linked!");
        
        bytes32 idHash = keccak256(bytes(_aadhaarPAN));
        require(identityToWallet[idHash] == address(0), "Identity already linked to another wallet!");

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

    // Property Application
    function requestRegistration(
        string memory _ownerName, 
        string memory _ipfsMetadata, 
        string memory _landArea, 
        string memory _landLocation,
        string memory _khasraNumber
    ) public payable nonReentrant {
        require(users[msg.sender].isRegistered, "Must link Identity/Aadhaar first!");
        require(msg.value >= registrationFee, "Insufficient Fee");
        
        _tokenIds++;
        requests[_tokenIds] = PropertyRequest(
            _tokenIds, msg.sender, _ownerName, _ipfsMetadata, "LINKED_ID",
            _landArea, _landLocation, _khasraNumber, Status.Pending, SaleStatus.NotForSale, 
            0, 0, 0, 0, address(0), block.timestamp
        );
        
        emit RequestSubmitted(_tokenIds, msg.sender);
    }

    // ==========================================
    // ⚖️ 2. SEQUENTIAL VERIFICATION PIPELINE
    // ==========================================

    // Phase 1: Govt Officer (Checks ID & Khasra)
    function verifyByGovt(uint256 _requestId) public onlyRole(GOVT_OFFICER_ROLE) {
        require(requests[_requestId].status == Status.Pending, "Stage Error");
        requests[_requestId].status = Status.GovtVerified;
        emit StatusUpdated(_requestId, Status.GovtVerified);
    }

    // Phase 2: Surveyor (Checks Photos & Location)
    function completeSurvey(uint256 _requestId) public onlyRole(SURVEYOR_ROLE) {
        require(requests[_requestId].status == Status.GovtVerified, "Not verified by Govt yet");
        requests[_requestId].status = Status.Surveyed;
        emit StatusUpdated(_requestId, Status.Surveyed);
    }

    // Phase 3: Registrar (Final Approval & NFT Mint)
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
    // 💰 3. MARKETPLACE LOGIC
    // ==========================================

    function listPropertyForSale(uint256 _tokenId, uint256 _priceInWei) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        require(requests[_tokenId].status == Status.Approved, "Not Approved");
        
        requests[_tokenId].saleStatus = SaleStatus.ForSale;
        requests[_tokenId].price = _priceInWei;
        emit PropertyStatusChanged(_tokenId, "For Sale", _priceInWei);
    }

    function buyProperty(uint256 _tokenId, string memory _newOwnerName) public payable nonReentrant {
        PropertyRequest storage prop = requests[_tokenId];
        address seller = ownerOf(_tokenId);

        require(users[msg.sender].isRegistered, "Buyer must link Aadhaar!");
        require(prop.saleStatus == SaleStatus.ForSale, "Not for sale");
        require(msg.value >= prop.price, "Low funds");

        payable(seller).transfer(msg.value);
        _transfer(seller, msg.sender, _tokenId); 

        prop.ownerName = _newOwnerName; 
        prop.requester = msg.sender; 
        prop.saleStatus = SaleStatus.NotForSale;

        emit PropertySold(_tokenId, seller, msg.sender, msg.value);
    }

    function listPropertyForLease(uint256 _tokenId, uint256 _leasePrice, uint256 _duration) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        requests[_tokenId].saleStatus = SaleStatus.ForLease;
        requests[_tokenId].leasePrice = _leasePrice;
        requests[_tokenId].leaseDuration = _duration;
        emit PropertyStatusChanged(_tokenId, "For Lease", _leasePrice);
    }

    function rentProperty(uint256 _tokenId) public payable nonReentrant {
        PropertyRequest storage prop = requests[_tokenId];
        require(users[msg.sender].isRegistered, "Tenant must link Aadhaar!");
        require(prop.saleStatus == SaleStatus.ForLease, "Not for lease");
        require(msg.value >= prop.leasePrice, "Low Rent");

        payable(ownerOf(_tokenId)).transfer(msg.value);
        prop.tenant = msg.sender;
        prop.leaseEndTime = block.timestamp + prop.leaseDuration;
        prop.saleStatus = SaleStatus.Occupied;
        emit PropertyRented(_tokenId, msg.sender, prop.leaseDuration, msg.value, block.timestamp);
    }

    function makePropertyPrivate(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not Owner");
        requests[_tokenId].saleStatus = SaleStatus.NotForSale;
        emit PropertyStatusChanged(_tokenId, "Private", 0);
    }

    // ==========================================
    // 🛠️ 4. VIEW & ADMIN
    // ==========================================

    function withdrawFunds() public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    function getAllRequests() public view returns (PropertyRequest[] memory) {
        PropertyRequest[] memory all = new PropertyRequest[](_tokenIds);
        for (uint256 i = 1; i <= _tokenIds; i++) {
            all[i-1] = requests[i];
        }
        return all;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}