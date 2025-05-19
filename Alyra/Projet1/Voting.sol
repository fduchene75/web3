// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {

    struct Voter { bool isRegistered; bool hasVoted; uint votedProposalId; }
    struct Proposal { string description; uint voteCount; }
    enum WorkflowStatus { RegisteringVoters, ProposalsRegistrationStarted, ProposalsRegistrationEnded, VotingSessionStarted, VotingSessionEnded, VotesTallied }
    uint winningProposalId;

    event VoterRegistered (address voterAddress);
    event WorkflowStatusChange (WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered (uint proposalId);
    event Voted (address voter, uint proposalId);
    event TalliedVotes (Proposal winningProposal);

    mapping (address => Voter) private votersList;
    WorkflowStatus public votingStatus;
    Proposal[] public proposalsList;

    constructor () Ownable(msg.sender) {}

    function getWinner () external view returns(uint, string memory) {
        require(votingStatus == WorkflowStatus.VotesTallied, "Voting process is not complete");
        return (proposalsList[winningProposalId].voteCount, proposalsList[winningProposalId].description);
    }

    function registerVoter (address _voterAddress) external onlyOwner {
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Voter registration session is closed");
        require(!votersList[_voterAddress].isRegistered, "Voter is already registered");
        votersList[_voterAddress] = Voter(true, false, 0);
        emit VoterRegistered(_voterAddress);
    }

    function startProposals () external onlyOwner {
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Voter registration session is closed");
        votingStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters,votingStatus);
    }

    function setProposal (string calldata _description) external {
        require(votersList[msg.sender].isRegistered, "Voter is not registered");
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration session is closed");
        require(bytes(_description).length > 0, "Proposal description is empty");
        proposalsList.push(Proposal(_description, 0));
        emit ProposalRegistered(proposalsList.length - 1);
    }

    function endProposals () external onlyOwner {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration session is already closed");
        votingStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted,votingStatus);
    }

    function startVotes () external onlyOwner {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationEnded, "Proposal registration session is not just closed");
        votingStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded,votingStatus);
    }

    function vote (uint _proposalId) external {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Voting session is not open");
        require(votersList[msg.sender].isRegistered, "Voter is not registered");
        require(!votersList[msg.sender].hasVoted, "Voter has already voted");
        require(_proposalId < proposalsList.length, "This proposal does not exist");
        proposalsList[_proposalId].voteCount += 1;
        votersList[msg.sender].hasVoted = true;
        votersList[msg.sender].votedProposalId = _proposalId;
        emit Voted(msg.sender, _proposalId);
    }

    function endVotes () external onlyOwner {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Voting session is already closed");
        votingStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted,votingStatus);
    }

    function tallyVotes () external onlyOwner {
        require(votingStatus == WorkflowStatus.VotingSessionEnded, "Voting session is not complete");
        for (uint i=0; i<proposalsList.length; i++) {
            if (proposalsList[i].voteCount > proposalsList[winningProposalId].voteCount) {
                winningProposalId = i;
            }
        }
        votingStatus = WorkflowStatus.VotesTallied;
        emit TalliedVotes (proposalsList[winningProposalId]);
    }

    function getVoteByAddr (address _voterAddr) external view returns (uint) {
        require(votersList[msg.sender].isRegistered, "You are not allowed to see this information");
        return votersList[_voterAddr].votedProposalId;
    }

}
