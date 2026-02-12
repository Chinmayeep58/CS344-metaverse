// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DisasterCertificate} from "./DistasterCertificate.sol";

contract DisasterCertificateTest is Test {
    DisasterCertificate public certificate;

    address public owner = address(1);
    address public teacher = address(2);
    address public student = address(3);
    address public unauthorized = address(4);

    string constant STUDENT_NAME = "John Doe";
    string constant STUDENT_EMAIL = "john@example.com";
    uint256 constant EXAM_SCORE = 85;
    string constant IPFS_HASH = "QmTest123456789";

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

    function setUp() public {
        vm.prank(owner);
        certificate = new DisasterCertificate();
    }

    // ============ Constructor Tests ============

    function test_ConstructorSetsOwner() public view {
        assertEq(certificate.owner(), owner);
    }

    function test_ConstructorAuthorizesOwnerAsTeacher() public view {
        assertTrue(certificate.authorizedTeachers(owner));
    }

    function test_ConstructorSetsCorrectTokenName() public view {
        assertEq(certificate.name(), "VR Disaster Training Certificate");
    }

    function test_ConstructorSetsCorrectTokenSymbol() public view {
        assertEq(certificate.symbol(), "VRDTC");
    }

    // ============ Teacher Authorization Tests ============

    function test_AuthorizeTeacher() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TeacherAuthorized(teacher);
        certificate.authorizeTeacher(teacher);

        assertTrue(certificate.authorizedTeachers(teacher));
    }

    function test_RevertIf_AuthorizeTeacherByNonOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        certificate.authorizeTeacher(teacher);
    }

    function test_RevertIf_AuthorizeZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid teacher address");
        certificate.authorizeTeacher(address(0));
    }

    function test_RevertIf_AuthorizeAlreadyAuthorizedTeacher() public {
        vm.startPrank(owner);
        certificate.authorizeTeacher(teacher);

        vm.expectRevert("Teacher already authorized");
        certificate.authorizeTeacher(teacher);
        vm.stopPrank();
    }

    function test_RevokeTeacherAuth() public {
        vm.startPrank(owner);
        certificate.authorizeTeacher(teacher);

        vm.expectEmit(true, false, false, false);
        emit TeacherRevoked(teacher);
        certificate.revokeTeacherAuth(teacher);
        vm.stopPrank();

        assertFalse(certificate.authorizedTeachers(teacher));
    }

    function test_RevertIf_RevokeUnauthorizedTeacher() public {
        vm.prank(owner);
        vm.expectRevert("Teacher not authorized");
        certificate.revokeTeacherAuth(teacher);
    }

    function test_RevertIf_RevokeTeacherByNonOwner() public {
        vm.prank(owner);
        certificate.authorizeTeacher(teacher);

        vm.prank(unauthorized);
        vm.expectRevert();
        certificate.revokeTeacherAuth(teacher);
    }

    // ============ Certificate Issuance Tests ============

    function test_IssueCertificate() public {
        vm.prank(owner);
        certificate.authorizeTeacher(teacher);

        vm.prank(teacher);
        vm.expectEmit(true, false, false, true);
        emit CertificateIssued(0, STUDENT_NAME, EXAM_SCORE, IPFS_HASH, teacher);

        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        assertEq(tokenId, 0);
        assertEq(certificate.ownerOf(tokenId), teacher);
    }

    function test_IssueCertificateByOwner() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        assertEq(tokenId, 0);
    }

    function test_RevertIf_IssueCertificateByUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert("Only authorized teachers can perform this action");
        certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );
    }

    function test_RevertIf_IssueCertificateWithLowScore() public {
        vm.prank(owner);
        vm.expectRevert("Score must be at least 70 to pass");
        certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            69,
            IPFS_HASH
        );
    }

    function test_RevertIf_IssueCertificateWithEmptyIPFSHash() public {
        vm.prank(owner);
        vm.expectRevert("IPFS hash required");
        certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            ""
        );
    }

    function test_CertificateDataStoredCorrectly() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        DisasterCertificate.Certificate memory cert = certificate
            .getCertificate(tokenId);

        assertEq(cert.tokenId, tokenId);
        assertEq(cert.studentName, STUDENT_NAME);
        assertEq(cert.studentEmail, STUDENT_EMAIL);
        assertEq(cert.examScore, EXAM_SCORE);
        assertEq(cert.ipfsHash, IPFS_HASH);
        assertEq(cert.issuedBy, owner);
        assertFalse(cert.revoked);
        assertEq(cert.issueDate, block.timestamp);
    }

    function test_TokenURISetCorrectly() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        string memory expectedURI = string(
            abi.encodePacked("ipfs://", IPFS_HASH)
        );
        assertEq(certificate.tokenURI(tokenId), expectedURI);
    }

    function test_MultipleIssuance() public {
        vm.startPrank(owner);

        uint256 tokenId1 = certificate.issueCertificate(
            "Student 1",
            "student1@example.com",
            75,
            "QmHash1"
        );

        uint256 tokenId2 = certificate.issueCertificate(
            "Student 2",
            "student2@example.com",
            80,
            "QmHash2"
        );

        vm.stopPrank();

        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(certificate.totalCertificatesIssued(), 2);
    }

    // ============ Certificate Revocation Tests ============

    function test_RevokeCertificate() public {
        vm.startPrank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        vm.expectEmit(true, false, false, true);
        emit CertificateRevoked(tokenId, owner);
        certificate.revokeCertificate(tokenId);
        vm.stopPrank();

        DisasterCertificate.Certificate memory cert = certificate
            .getCertificate(tokenId);
        assertTrue(cert.revoked);
    }

    function test_RevertIf_RevokeNonExistentCertificate() public {
        vm.prank(owner);
        vm.expectRevert("Certificate does not exist");
        certificate.revokeCertificate(999);
    }

    function test_RevertIf_RevokeAlreadyRevokedCertificate() public {
        vm.startPrank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        certificate.revokeCertificate(tokenId);

        vm.expectRevert("Certificate already revoked");
        certificate.revokeCertificate(tokenId);
        vm.stopPrank();
    }

    function test_RevertIf_RevokeCertificateByUnauthorized() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        vm.prank(unauthorized);
        vm.expectRevert("Only authorized teachers can perform this action");
        certificate.revokeCertificate(tokenId);
    }

    // ============ Certificate Retrieval Tests ============

    function test_GetCertificate() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        DisasterCertificate.Certificate memory cert = certificate
            .getCertificate(tokenId);
        assertEq(cert.studentName, STUDENT_NAME);
    }

    function test_RevertIf_GetNonExistentCertificate() public {
        vm.expectRevert("Certificate does not exist");
        certificate.getCertificate(999);
    }

    // ============ Certificate Verification Tests ============

    function test_VerifyValidCertificate() public {
        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        (
            bool isValid,
            DisasterCertificate.Certificate memory cert
        ) = certificate.verifyCertificate(tokenId);

        assertTrue(isValid);
        assertEq(cert.studentName, STUDENT_NAME);
    }

    function test_VerifyRevokedCertificate() public {
        vm.startPrank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );

        certificate.revokeCertificate(tokenId);
        vm.stopPrank();

        (bool isValid, ) = certificate.verifyCertificate(tokenId);
        assertFalse(isValid);
    }

    function test_VerifyNonExistentCertificate() public view {
        (bool isValid, ) = certificate.verifyCertificate(999);
        assertFalse(isValid);
    }

    // ============ View Function Tests ============

    function test_TotalCertificatesIssued() public {
        assertEq(certificate.totalCertificatesIssued(), 0);

        vm.startPrank(owner);
        certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            EXAM_SCORE,
            IPFS_HASH
        );
        assertEq(certificate.totalCertificatesIssued(), 1);

        certificate.issueCertificate(
            "Jane Doe",
            "jane@example.com",
            90,
            "QmHash2"
        );
        assertEq(certificate.totalCertificatesIssued(), 2);
        vm.stopPrank();
    }

    function test_IsAuthorizedTeacher() public {
        assertTrue(certificate.isAuthorizedTeacher(owner));
        assertFalse(certificate.isAuthorizedTeacher(teacher));

        vm.prank(owner);
        certificate.authorizeTeacher(teacher);
        assertTrue(certificate.isAuthorizedTeacher(teacher));
    }

    // ============ Edge Cases and Fuzz Tests ============

    function testFuzz_IssueCertificateWithValidScore(uint256 score) public {
        // Bound the score between 70 and 100 instead of using vm.assume
        score = bound(score, 70, 100);

        vm.prank(owner);
        uint256 tokenId = certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            score,
            IPFS_HASH
        );

        DisasterCertificate.Certificate memory cert = certificate
            .getCertificate(tokenId);
        assertEq(cert.examScore, score);
    }

    function testFuzz_IssueCertificateWithInvalidScore(uint256 score) public {
        vm.assume(score < 70);

        vm.prank(owner);
        vm.expectRevert("Score must be at least 70 to pass");
        certificate.issueCertificate(
            STUDENT_NAME,
            STUDENT_EMAIL,
            score,
            IPFS_HASH
        );
    }
}
