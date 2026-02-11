// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DisasterCertificate is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct Certificate {
        uint256 tokenId;
        string studentName;
        string studentEmail;
        uint256 examScore;
        uint256 issueDate;
        string ipfsHash;
        address issuedBy;
        bool revoked;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedTeachers;

    event CertificateIssued(
        uint256 indexed tokenId,
        string studentName,
        uint256 examScore,
        string ipfsHash,
        address indexed issuedBy
    );

    event CertificateRevoked(uint256 indexed tokenId, address revokedBy);
    event TeacherAuthorized(address indexed teacher);
    event TeacherRevoked(address indexed teacher);

    constructor()
        ERC721("VR Disaster Training Certificate", "VRDTC")
        Ownable(msg.sender)
    {
        authorizedTeachers[msg.sender] = true;
    }

    modifier onlyTeacher() {
        require(
            authorizedTeachers[msg.sender] || msg.sender == owner(),
            "Only authorized teachers can perform this action"
        );
        _;
    }

    function authorizeTeacher(address teacher) external onlyOwner {
        require(teacher != address(0), "Invalid teacher address");
        require(!authorizedTeachers[teacher], "Teacher already authorized");

        authorizedTeachers[teacher] = true;
        emit TeacherAuthorized(teacher);
    }

    function revokeTeacherAuth(address teacher) external onlyOwner {
        require(authorizedTeachers[teacher], "Teacher not authorized");

        authorizedTeachers[teacher] = false;
        emit TeacherRevoked(teacher);
    }

    function issueCertificate(
        string memory studentName,
        string memory studentEmail,
        uint256 examScore,
        string memory ipfsHash
    ) external onlyTeacher returns (uint256) {
        require(examScore >= 70, "Score must be at least 70 to pass");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        string memory uri = string(abi.encodePacked("ipfs://", ipfsHash));
        _setTokenURI(tokenId, uri);

        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            studentName: studentName,
            studentEmail: studentEmail,
            examScore: examScore,
            issueDate: block.timestamp,
            ipfsHash: ipfsHash,
            issuedBy: msg.sender,
            revoked: false
        });

        emit CertificateIssued(
            tokenId,
            studentName,
            examScore,
            ipfsHash,
            msg.sender
        );

        return tokenId;
    }

    function revokeCertificate(uint256 tokenId) external onlyTeacher {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!certificates[tokenId].revoked, "Certificate already revoked");

        certificates[tokenId].revoked = true;
        emit CertificateRevoked(tokenId, msg.sender);
    }

    function getCertificate(uint256 tokenId)
        external
        view
        returns (Certificate memory)
    {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        return certificates[tokenId];
    }

    function verifyCertificate(uint256 tokenId)
        external
        view
        returns (bool isValid, Certificate memory cert)
    {
        if (_ownerOf(tokenId) == address(0)) {
            return (false, cert);
        }

        cert = certificates[tokenId];
        isValid = !cert.revoked;
        return (isValid, cert);
    }

    function totalCertificatesIssued() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function isAuthorizedTeacher(address teacher) external view returns (bool) {
        return authorizedTeachers[teacher];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
