import { describe, it } from "node:test";
import { expect } from "chai";
import { getAddress } from "viem";
import hre from "hardhat";

describe("DisasterCertificate", function () {
    const STUDENT_NAME = "John Doe";
    const STUDENT_EMAIL = "john@example.com";
    const EXAM_SCORE = 85n;
    const IPFS_HASH = "QmTest123456789";

    async function deployDisasterCertificateFixture() {
        const [owner, teacher, student, unauthorized] =
            await hre.viem.getWalletClients();

        const certificate = await hre.viem.deployContract(
            "DisasterCertificate",
            [],
        );

        const publicClient = await hre.viem.getPublicClient();

        return {
            certificate,
            owner,
            teacher,
            student,
            unauthorized,
            publicClient,
        };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { certificate, owner } =
                await deployDisasterCertificateFixture();
            expect(await certificate.read.owner()).to.equal(
                getAddress(owner.account.address),
            );
        });

        it("Should authorize owner as teacher", async function () {
            const { certificate, owner } =
                await deployDisasterCertificateFixture();
            expect(
                await certificate.read.authorizedTeachers([
                    owner.account.address,
                ]),
            ).to.be.true;
        });

        it("Should set correct token name", async function () {
            const { certificate } = await deployDisasterCertificateFixture();
            expect(await certificate.read.name()).to.equal(
                "VR Disaster Training Certificate",
            );
        });

        it("Should set correct token symbol", async function () {
            const { certificate } = await deployDisasterCertificateFixture();
            expect(await certificate.read.symbol()).to.equal("VRDTC");
        });
    });

    describe("Teacher Authorization", function () {
        it("Should authorize a new teacher", async function () {
            const { certificate, owner, teacher } =
                await deployDisasterCertificateFixture();

            await certificate.write.authorizeTeacher([teacher.account.address]);

            expect(
                await certificate.read.authorizedTeachers([
                    teacher.account.address,
                ]),
            ).to.be.true;
        });

        it("Should emit TeacherAuthorized event", async function () {
            const { certificate, teacher, publicClient } =
                await deployDisasterCertificateFixture();

            const hash = await certificate.write.authorizeTeacher([
                teacher.account.address,
            ]);
            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            const events = await certificate.getEvents.TeacherAuthorized();
            expect(events).to.have.lengthOf(1);
            expect(events[0].args.teacher).to.equal(
                getAddress(teacher.account.address),
            );
        });

        it("Should revert if non-owner tries to authorize teacher", async function () {
            const { certificate, teacher, unauthorized } =
                await deployDisasterCertificateFixture();

            await expect(
                certificate.write.authorizeTeacher([teacher.account.address], {
                    account: unauthorized.account,
                }),
            ).to.be.rejected;
        });

        it("Should revert if authorizing zero address", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await expect(
                certificate.write.authorizeTeacher([
                    "0x0000000000000000000000000000000000000000",
                ]),
            ).to.be.rejectedWith("Invalid teacher address");
        });

        it("Should revert if authorizing already authorized teacher", async function () {
            const { certificate, teacher } =
                await deployDisasterCertificateFixture();

            await certificate.write.authorizeTeacher([teacher.account.address]);

            await expect(
                certificate.write.authorizeTeacher([teacher.account.address]),
            ).to.be.rejectedWith("Teacher already authorized");
        });

        it("Should revoke teacher authorization", async function () {
            const { certificate, teacher } =
                await deployDisasterCertificateFixture();

            await certificate.write.authorizeTeacher([teacher.account.address]);
            await certificate.write.revokeTeacherAuth([
                teacher.account.address,
            ]);

            expect(
                await certificate.read.authorizedTeachers([
                    teacher.account.address,
                ]),
            ).to.be.false;
        });

        it("Should emit TeacherRevoked event", async function () {
            const { certificate, teacher, publicClient } =
                await deployDisasterCertificateFixture();

            await certificate.write.authorizeTeacher([teacher.account.address]);
            const hash = await certificate.write.revokeTeacherAuth([
                teacher.account.address,
            ]);
            await publicClient.waitForTransactionReceipt({ hash });

            const events = await certificate.getEvents.TeacherRevoked();
            expect(events).to.have.lengthOf(1);
            expect(events[0].args.teacher).to.equal(
                getAddress(teacher.account.address),
            );
        });

        it("Should revert if revoking unauthorized teacher", async function () {
            const { certificate, teacher } =
                await deployDisasterCertificateFixture();

            await expect(
                certificate.write.revokeTeacherAuth([teacher.account.address]),
            ).to.be.rejectedWith("Teacher not authorized");
        });
    });

    describe("Certificate Issuance", function () {
        it("Should issue certificate by authorized teacher", async function () {
            const { certificate, teacher } =
                await deployDisasterCertificateFixture();

            await certificate.write.authorizeTeacher([teacher.account.address]);

            const tokenId = await certificate.write.issueCertificate(
                [STUDENT_NAME, STUDENT_EMAIL, EXAM_SCORE, IPFS_HASH],
                { account: teacher.account },
            );

            expect(tokenId).to.exist;
        });

        it("Should issue certificate by owner", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            const hash = await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            expect(hash).to.exist;
        });

        it("Should emit CertificateIssued event", async function () {
            const { certificate, owner, publicClient } =
                await deployDisasterCertificateFixture();

            const hash = await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await publicClient.waitForTransactionReceipt({ hash });

            const events = await certificate.getEvents.CertificateIssued();
            expect(events).to.have.lengthOf(1);
            expect(events[0].args.studentName).to.equal(STUDENT_NAME);
            expect(events[0].args.examScore).to.equal(EXAM_SCORE);
            expect(events[0].args.ipfsHash).to.equal(IPFS_HASH);
        });

        it("Should revert if unauthorized user tries to issue", async function () {
            const { certificate, unauthorized } =
                await deployDisasterCertificateFixture();

            await expect(
                certificate.write.issueCertificate(
                    [STUDENT_NAME, STUDENT_EMAIL, EXAM_SCORE, IPFS_HASH],
                    { account: unauthorized.account },
                ),
            ).to.be.rejectedWith(
                "Only authorized teachers can perform this action",
            );
        });

        it("Should revert if score is below 70", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await expect(
                certificate.write.issueCertificate([
                    STUDENT_NAME,
                    STUDENT_EMAIL,
                    69n,
                    IPFS_HASH,
                ]),
            ).to.be.rejectedWith("Score must be at least 70 to pass");
        });

        it("Should revert if IPFS hash is empty", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await expect(
                certificate.write.issueCertificate([
                    STUDENT_NAME,
                    STUDENT_EMAIL,
                    EXAM_SCORE,
                    "",
                ]),
            ).to.be.rejectedWith("IPFS hash required");
        });

        it("Should store certificate data correctly", async function () {
            const { certificate, owner, publicClient } =
                await deployDisasterCertificateFixture();

            const hash = await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await publicClient.waitForTransactionReceipt({ hash });

            const cert = await certificate.read.getCertificate([0n]);

            expect(cert[0]).to.equal(0n); // tokenId
            expect(cert[1]).to.equal(STUDENT_NAME); // studentName
            expect(cert[2]).to.equal(STUDENT_EMAIL); // studentEmail
            expect(cert[3]).to.equal(EXAM_SCORE); // examScore
            expect(cert[5]).to.equal(IPFS_HASH); // ipfsHash
            expect(cert[6]).to.equal(getAddress(owner.account.address)); // issuedBy
            expect(cert[7]).to.be.false; // revoked
        });

        it("Should set token URI correctly", async function () {
            const { certificate, publicClient } =
                await deployDisasterCertificateFixture();

            const hash = await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await publicClient.waitForTransactionReceipt({ hash });

            const tokenURI = await certificate.read.tokenURI([0n]);
            expect(tokenURI).to.equal(`ipfs://${IPFS_HASH}`);
        });

        it("Should issue multiple certificates", async function () {
            const { certificate, publicClient } =
                await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                "Student 1",
                "student1@example.com",
                75n,
                "QmHash1",
            ]);

            await certificate.write.issueCertificate([
                "Student 2",
                "student2@example.com",
                80n,
                "QmHash2",
            ]);

            const total = await certificate.read.totalCertificatesIssued();
            expect(total).to.equal(2n);
        });
    });

    describe("Certificate Revocation", function () {
        it("Should revoke certificate", async function () {
            const { certificate, publicClient } =
                await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await certificate.write.revokeCertificate([0n]);

            const cert = await certificate.read.getCertificate([0n]);
            expect(cert[7]).to.be.true; // revoked
        });

        it("Should emit CertificateRevoked event", async function () {
            const { certificate, publicClient } =
                await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            const hash = await certificate.write.revokeCertificate([0n]);
            await publicClient.waitForTransactionReceipt({ hash });

            const events = await certificate.getEvents.CertificateRevoked();
            expect(events).to.have.lengthOf(1);
            expect(events[0].args.tokenId).to.equal(0n);
        });

        it("Should revert if certificate does not exist", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await expect(
                certificate.write.revokeCertificate([999n]),
            ).to.be.rejectedWith("Certificate does not exist");
        });

        it("Should revert if certificate already revoked", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await certificate.write.revokeCertificate([0n]);

            await expect(
                certificate.write.revokeCertificate([0n]),
            ).to.be.rejectedWith("Certificate already revoked");
        });

        it("Should revert if unauthorized user tries to revoke", async function () {
            const { certificate, unauthorized } =
                await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await expect(
                certificate.write.revokeCertificate([0n], {
                    account: unauthorized.account,
                }),
            ).to.be.rejectedWith(
                "Only authorized teachers can perform this action",
            );
        });
    });

    describe("Certificate Verification", function () {
        it("Should verify valid certificate", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            const [isValid, cert] = await certificate.read.verifyCertificate([
                0n,
            ]);

            expect(isValid).to.be.true;
            expect(cert[1]).to.equal(STUDENT_NAME);
        });

        it("Should return false for revoked certificate", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            await certificate.write.revokeCertificate([0n]);

            const [isValid] = await certificate.read.verifyCertificate([0n]);
            expect(isValid).to.be.false;
        });

        it("Should return false for non-existent certificate", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            const [isValid] = await certificate.read.verifyCertificate([999n]);
            expect(isValid).to.be.false;
        });
    });

    describe("View Functions", function () {
        it("Should return total certificates issued", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            expect(await certificate.read.totalCertificatesIssued()).to.equal(
                0n,
            );

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            expect(await certificate.read.totalCertificatesIssued()).to.equal(
                1n,
            );
        });

        it("Should check if teacher is authorized", async function () {
            const { certificate, owner, teacher } =
                await deployDisasterCertificateFixture();

            expect(
                await certificate.read.isAuthorizedTeacher([
                    owner.account.address,
                ]),
            ).to.be.true;
            expect(
                await certificate.read.isAuthorizedTeacher([
                    teacher.account.address,
                ]),
            ).to.be.false;

            await certificate.write.authorizeTeacher([teacher.account.address]);
            expect(
                await certificate.read.isAuthorizedTeacher([
                    teacher.account.address,
                ]),
            ).to.be.true;
        });

        it("Should get certificate details", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await certificate.write.issueCertificate([
                STUDENT_NAME,
                STUDENT_EMAIL,
                EXAM_SCORE,
                IPFS_HASH,
            ]);

            const cert = await certificate.read.getCertificate([0n]);
            expect(cert[1]).to.equal(STUDENT_NAME);
        });

        it("Should revert when getting non-existent certificate", async function () {
            const { certificate } = await deployDisasterCertificateFixture();

            await expect(
                certificate.read.getCertificate([999n]),
            ).to.be.rejectedWith("Certificate does not exist");
        });
    });
});
