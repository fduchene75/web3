const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect, assert } = require("chai");

describe("Testing Voting", function () {
  
  // Fixture de base
  async function deployVotingFixture() {
      const [owner, voter1, voter2, voter3] = await ethers.getSigners();
      const Voting = await ethers.getContractFactory("Voting");
      const voting = await Voting.deploy();
      return { voting, owner, voter1, voter2, voter3 };
  }

  // Fixture avec votants enregistrés
  async function deployVotingWithVotersFixture() {
      const { voting, owner, voter1, voter2, voter3 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      return { voting, owner, voter1, voter2, voter3 };
  }

  // Fixture avec propositions enregistrées
  async function deployVotingWithProposalsFixture() {
      const { voting, owner, voter1, voter2, voter3 } = await deployVotingWithVotersFixture();
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal 1");
      await voting.connect(voter2).addProposal("Proposal 2");
      return { voting, owner, voter1, voter2, voter3 };
  }

  describe("Deployment", function () {
    let voting, owner;
    beforeEach(async function () {
      ({ voting, owner } = await loadFixture(deployVotingFixture));
    });
    it('Has an owner', async function () {
        expect(await voting.owner()).to.equal(owner.address);
    });
    it('Has no winning proposal', async function () {
        expect(await voting.winningProposalID()).to.equal(0);
    });
    it('Workflow status is RegisteringVoters', async function () {
        expect(await voting.workflowStatus()).to.equal(0);
    });                
  });

  describe("Registration of voters", function () {
    let voting, owner, voter1, voter2;
    beforeEach(async function () {
      ({ voting, owner, voter1, voter2 } = await loadFixture(deployVotingFixture));
    });
    it('Should set and get voter 1', async function () {
        await voting.addVoter(voter1.address);
        const voterInfo = await voting.connect(voter1).getVoter(voter1.address);
        expect(voterInfo.isRegistered).to.be.true;
    });        
    it('Should set and get voter 1 and 2', async function () {
        await voting.addVoter(voter1.address);
        await voting.addVoter(voter2.address);
        const voterInfo = await voting.connect(voter1).getVoter(voter2.address);
        expect(voterInfo.isRegistered).to.be.true;
    });        
    it('Cannot set voter 2 twice', async function () {
        await voting.addVoter(voter1.address);
        await voting.addVoter(voter2.address);
        await expect(voting.addVoter(voter2.address)).to.be.revertedWith('Already registered');
    });    
    it('Should revert if non-owner tries to add voter', async function () {
      await voting.addVoter(voter1.address);
      await expect(voting.connect(voter1).addVoter(voter2.address))
      .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount');
    });                 
  });

  describe("Initial workflow management", function () {
    let voting, owner, voter1;
    beforeEach(async function () {
      ({ voting, owner, voter1 } = await loadFixture(deployVotingWithVotersFixture)); 
    });
    
    it('Should start proposals registration', async function () {
      await expect(voting.startProposalsRegistering())
          .to.emit(voting, 'WorkflowStatusChange')
          .withArgs(0, 1);
      expect(await voting.workflowStatus()).to.equal(1);
    });

    it('Should create GENESIS proposal when starting proposals registration', async function () {
      await voting.startProposalsRegistering();
      const proposal = await voting.connect(voter1).getOneProposal(0);
      expect(proposal.description).to.equal("GENESIS");
      expect(proposal.voteCount).to.equal(0);
    });
  });

  describe("Complete workflow", function() {
    it("Should follow all steps till the end", async function() {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingWithProposalsFixture);
      
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      
      // Votes
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(1);
      
      await voting.endVotingSession();
      await voting.tallyVotes();
      
      expect(await voting.winningProposalID()).to.equal(1);
    });
  });

  describe("Security", function() {
    it("A non-voter cannot make a proposal", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      await voting.startProposalsRegistering();
      await expect(voting.connect(voter1).addProposal("Test"))
        .to.be.revertedWith("You're not a voter");
    });

    it("Cannot vote when voting session is closed", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithProposalsFixture);
      await expect(voting.connect(voter1).setVote(0))
        .to.be.revertedWith("Voting session havent started yet");
    });

    it("Cannot add voters when registration session is closed", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithVotersFixture);
      await voting.startProposalsRegistering();
      await expect(voting.addVoter(voter1.address))
        .to.be.revertedWith("Voters registration is not open yet");
    });
  });

  describe("Proposals management", function() {
    it("Should reject empty proposals", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithVotersFixture);
      await voting.startProposalsRegistering();
      await expect(voting.connect(voter1).addProposal(""))
        .to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("Same voter can make several proposals", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithVotersFixture);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Prop11");
      await voting.connect(voter1).addProposal("Prop12");
      const proposal = await voting.connect(voter1).getOneProposal(2);
      expect(proposal.description).to.equal("Prop12");
    });
  });

  describe("Results", function() {
    it("Should select the right proposal", async function() {
      const { voting, voter1, voter2, voter3 } = await loadFixture(deployVotingWithProposalsFixture);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(2);
      await voting.endVotingSession();
      await voting.tallyVotes();
      expect(await voting.winningProposalID()).to.equal(2);
    });
  });

  describe("Events", function() {
    it("Should emit an event after voting", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithProposalsFixture);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.connect(voter1).setVote(1))
        .to.emit(voting, 'Voted')
        .withArgs(voter1.address, 1);
    });
  });

  describe("Load testing", function() {
    it("Should handle Nb proposals with Nb=100", async function() {
      const { voting, voter1 } = await loadFixture(deployVotingWithVotersFixture);
      const Nb = 100;
      await voting.startProposalsRegistering();
      
      for(let i = 1; i < Nb; i++) {
        await voting.connect(voter1).addProposal(`Proposal ${i}`);
      }
      // GENESIS, Proposal 1, Proposal 2... Proposal Nb-1
      const lastProp = await voting.connect(voter1).getOneProposal(Nb-1);
      expect(lastProp.description).to.equal(`Proposal ${Nb-1}`);
    });
  });

});
