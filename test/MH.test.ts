import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

describe("MH", () => {
  let MH: Contract;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  let root: any;
  let tree: MerkleTree;
  let freeRoot: any;

  beforeEach(async () => {
    const MHFactory = await ethers.getContractFactory("MH");
    [owner, address1, address2, address3] = await ethers.getSigners();

    const leaves = [owner.address, address1.address, address2.address].map(
      (v) => keccak256(v)
    );
    tree = new MerkleTree(leaves, keccak256, { sort: true });
    root = tree.getHexRoot();
    freeRoot = root;

    MH = await MHFactory.deploy(root, freeRoot);
  });

  xit("Should initialize MH Contract and check mint price is .077", async () => {
    const inWei = await MH.item_price_public();
    expect(parseFloat(web3.utils.fromWei(inWei.toString(), "ether"))).to.equal(
      0.077
    );
  });

  xit("Should set the right owner", async () => {
    expect(await MH.owner()).to.equal(await owner.address);
  });

  xit("Should allow allowlisted address to execute allowlist mint using proof, mint address balance should match # of mints executed", async () => {
    const leaf = keccak256(address1.address);
    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await MH.connect(address1).allowlistMint(proof, 1, {
      value: ethers.utils.parseEther(".06"),
    });

    const balance = await MH.balanceOf(address1.address);
    expect(balance.toNumber()).to.equal(1);
  });

  xit("Should not allow more allowlist mints than allowlistMintMaxPerTx allows", async () => {
    const leaf = keccak256(owner.address);
    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await expect(
      MH.allowlistMint(proof, 2, {
        value: ethers.utils.parseEther(".32"),
      })
    ).to.be.revertedWith("IncorrectAmtOfEthForTx");
  });

  xit("Should not allow allowlist mints with incorrect payment value", async () => {
    const leaf = keccak256(owner.address);
    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await expect(
      MH.allowlistMint(proof, 1, {
        value: ethers.utils.parseEther(".1"),
      })
    ).to.be.revertedWith("IncorrectAmtOfEthForTx");
  });

  xit("Should not allow allowlist mints with invalid proof/root/leaf", async () => {
    const leaf = keccak256(address3.address); // address3 is not in the merkle tree

    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await expect(
      MH.allowlistMint(proof, 1, {
        value: ethers.utils.parseEther(".06"),
      })
    ).to.be.revertedWith("InvalidProof");
  });

  xit("Should not allow allowlist mint if allowlist mint is not active", async () => {
    const leaf = keccak256(owner.address);
    const proof = tree.getHexProof(leaf);

    await expect(
      MH.allowlistMint(proof, 2, {
        value: ethers.utils.parseEther(".12"),
      })
    ).to.be.revertedWith("AllowlistMintNotActive");
  });

  xit("Should not allow allowlist mint if # of mints exceeds MAX_TOTAL_TOKENS - internals", async () => {
    const leaf = keccak256(owner.address);
    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await expect(
      MH.allowlistMint(proof, 3, {
        value: ethers.utils.parseEther(".18"),
      })
    ).to.be.revertedWith("NotEnoughNftsLeftToMint");
  });

  xit("Should allow public mint from any address, mint address balance should match # of mints executed, max public mint per tx should not be exceeded", async () => {
    await MH.setPublicMintActive(true);

    await MH.publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    const balance = await MH.balanceOf(owner.address);

    expect(balance.toNumber()).to.equal(1);

    await expect(
      MH.publicMint(5, {
        value: ethers.utils.parseEther(".40"),
      })
    ).to.be.reverted;
  });

  xit("Should not exceed max public mint per tx #", async () => {
    MH.setPublicMintActive(true);

    await expect(
      MH.publicMint(3, {
        value: ethers.utils.parseEther(".231"),
      })
    ).to.be.revertedWith("TooManyNFTsInSingleTx");
  });

  xit("Should not allow max supply to be exceeded during public mint", async () => {
    MH.setPublicMintActive(true);

    MH.publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    MH.connect(address1).publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    await expect(
      MH.connect(address2).publicMint(1, {
        value: ethers.utils.parseEther(".077"),
      })
    ).to.be.revertedWith("NotEnoughNftsLeftToMint");
  });

  xit("Should not be allowed to public mint if it is not active", async () => {
    await expect(
      MH.publicMint(1, {
        value: ethers.utils.parseEther(".077"),
      })
    ).to.be.revertedWith("PublicMintNotActive");
  });

  xit("Should not be allowed to public mint with incorrect payment value", async () => {
    MH.setPublicMintActive(true);

    await expect(
      MH.publicMint(1, {
        value: ethers.utils.parseEther(".09"),
      })
    ).to.be.revertedWith("IncorrectAmtOfEthForTx");
  });

  xit("Should allow internal mint from any address inside internals mapping, mint address balance should match # of mints executed", async () => {
    await expect(MH.internalMint(1));

    const balance = await MH.balanceOf(owner.address);

    expect(balance.toNumber()).to.equal(1);
  });

  xit("Should not exceed allowance # of internal mints", async () => {
    await expect(MH.internalMint(2)).to.be.revertedWith(
      "InvalidInternalAmount"
    );
  });

  xit("Should return unrevealerdURI if is_revealed === false", async () => {
    MH.internalMint(1);

    const testURI = await MH.tokenURI(0);

    expect(testURI).to.equal("ipfs://unrevealedURI");
  });

  xit("Should not allow tokenURI query for token that has not been minted or does not exist", async () => {
    MH.internalMint(1);

    await expect(MH.tokenURI(1)).to.be.revertedWith(
      "URIQueryForNonexistentToken"
    );

    await expect(MH.tokenURI(10000)).to.be.revertedWith(
      "URIQueryForNonexistentToken"
    );
  });

  xit("Should return revealedURI + tokenID + .json if is_revealed === true", async () => {
    MH.internalMint(1);

    MH.setIsRevealed(true);

    const testURI = await MH.tokenURI(0);

    expect(testURI).to.equal("revealedURI.ipfs/0.json");
  });

  xit("Any ETH or ERC20 txns should be reverted", async () => {
    await expect(
      address1.sendTransaction({
        to: MH.address,
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("ContractDoesNotAllowReceiptOfTokens");
  });

  xit("Should not allow more mints than PUB_MINT_MAX_PER_TX", async () => {
    MH.setPublicMintActive(true);

    await expect(
      MH.publicMint(4, {
        value: ethers.utils.parseEther(".231"),
      })
    ).to.be.revertedWith("TooManyNFTsInSingleTx");
  });

  it("Should not allow transfers while staked", async () => {
    MH.setPublicMintActive(true);

    await MH.publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    await MH.setStakingOpen(true);

    await MH.toggleStaking([0]);

    await expect(
      MH.transferFrom(owner.address, address1.address, 0)
    ).to.be.revertedWith("Staking Active");
  });

  it("Should allow multiple NFTs to be staked and unstaked at the same time", async () => {
    const leaf = keccak256(owner.address);
    const proof = tree.getHexProof(leaf);

    MH.setAllowlistMintActive(true);

    await MH.allowlistMint(proof, 2, {
      value: ethers.utils.parseEther(".154"),
    });

    await MH.setStakingOpen(true);

    await MH.toggleStaking([0, 1]);

    await expect(
      MH.transferFrom(owner.address, address1.address, 0)
    ).to.be.revertedWith("Staking Active");

    await expect(
      MH.transferFrom(owner.address, address1.address, 1)
    ).to.be.revertedWith("Staking Active");

    // console.log(await MH.stakingPeriod(0));

    await MH.toggleStaking([0, 1]);

    await expect((await MH.stakingPeriod(0)).staking).to.equal(false);
    await expect((await MH.stakingPeriod(1)).staking).to.equal(false);
  });

  it("Should return a valid stake period when stakingPeriod is called", async () => {
    MH.setPublicMintActive(true);

    await MH.publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    await MH.setStakingOpen(true);

    await MH.toggleStaking([0]);

    await expect(
      MH.transferFrom(owner.address, address1.address, 0)
    ).to.be.revertedWith("Staking Active");

    await expect(
      parseFloat((await MH.stakingPeriod(0)).current)
    ).to.be.greaterThan(0);

    await expect(
      parseFloat((await MH.stakingPeriod(0)).total)
    ).to.be.greaterThan(0);

    await MH.toggleStaking([0]);

    await expect((await MH.stakingPeriod(0)).current).to.equal(0);
    await expect(
      parseFloat((await MH.stakingPeriod(0)).total)
    ).to.be.greaterThan(0);
  });

  it("Should not allow staking when global staking is turned off", async () => {
    MH.setPublicMintActive(true);

    await MH.publicMint(1, {
      value: ethers.utils.parseEther(".077"),
    });

    await expect(MH.toggleStaking([0])).to.be.revertedWith("StakingClosed");
  });
});
