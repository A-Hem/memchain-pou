// ARCHITECTURE OVERVIEW:
// 1. On-chain: WorkerRegistry (store worker metadata and code)
// 2. On-chain: WorkerExecutionVerifier (verify execution results)
// 3. On-chain: RewardDistribution (distribute rewards)
// 4. Off-chain: JITExecutionNode (run worker code, submit results)
// 5. Off-chain: UtilityAssessment (evaluate worker output utility)

// -----------------------------------------------------
// ON-CHAIN: Updated WorkerRegistry.sol
// -----------------------------------------------------

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WorkerRegistry {
    struct Worker {
        address owner;
        string language;
        string code;
        string codeHash;  // Hash of the code for verification
    }

    mapping(bytes32 => Worker) public workers;
    
    event WorkerRegistered(bytes32 indexed workerId, address indexed owner, string language);
    
    function registerWorker(bytes32 workerId, string memory language, string memory code) public {
        require(workers[workerId].owner == address(0), "Worker already registered");
        
        // Generate hash of the code for verification
        string memory codeHash = keccak256(abi.encodePacked(code));
        
        workers[workerId] = Worker({
            owner: msg.sender, 
            language: language, 
            code: code,
            codeHash: codeHash
        });
        
        emit WorkerRegistered(workerId, msg.sender, language);
    }
}

// -----------------------------------------------------
// ON-CHAIN: WorkerExecutionVerifier.sol
// -----------------------------------------------------

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./WorkerRegistry.sol";

contract WorkerExecutionVerifier {
    WorkerRegistry public workerRegistry;
    
    // Mapping to store execution results
    mapping(bytes32 => bool) public executionResults;
    
    event ExecutionVerified(bytes32 indexed executionId, bytes32 indexed workerId, bool result);
    
    constructor(address _workerRegistryAddress) {
        workerRegistry = WorkerRegistry(_workerRegistryAddress);
    }
    
    // Submit execution result (called by authorized execution nodes)
    function submitExecutionResult(
        bytes32 executionId,
        bytes32 workerId,
        bytes memory input,
        bytes memory output,
        bool successful
    ) public {
        // In a real implementation, you'd verify the execution
        // and may require consensus from multiple nodes
        
        executionResults[executionId] = successful;
        
        emit ExecutionVerified(executionId, workerId, successful);
    }
}

// -----------------------------------------------------
// OFF-CHAIN: Updated JITEngine.js
// -----------------------------------------------------

const { NodeVM } = require('vm2');
const Web3 = require('web3');
const { WorkerRegistry } = require('./WorkerRegistry');
const { WorkerExecutionVerifier } = require('./WorkerExecutionVerifier');

class JITExecutionNode {
  constructor(workerRegistryAddress, verifierAddress, web3Provider) {
    this.web3 = new Web3(web3Provider);
    
    // Initialize contract instances
    this.workerRegistry = new this.web3.eth.Contract(
      WorkerRegistry.abi,
      workerRegistryAddress
    );
    
    this.verifier = new this.web3.eth.Contract(
      WorkerExecutionVerifier.abi,
      verifierAddress
    );
    
    this.executionQueue = [];
  }

  async fetchWorkerCode(workerId) {
    const worker = await this.workerRegistry.methods.workers(workerId).call();
    return worker.code;
  }

  async executeWorker(workerId, input) {
    // Fetch worker code from blockchain
    const code = await this.fetchWorkerCode(workerId);
    
    // Create a VM sandbox
    const vm = new NodeVM({
      sandbox: { input, console },
      require: { external: true }
    });

    try {
      // Execute the code
      const script = new vm.Script(code);
      const result = script.run();
      
      // Create a unique execution ID
      const executionId = this.web3.utils.keccak256(
        this.web3.eth.abi.encodeParameters(
          ['bytes32', 'bytes', 'uint256'],
          [workerId, input, Date.now()]
        )
      );
      
      // Submit the result to the blockchain
      await this.submitResult(executionId, workerId, input, result, true);
      
      return result;
    } catch (error) {
      console.error('Execution failed:', error);
      
      // Submit failed execution
      await this.submitResult(executionId, workerId, input, null, false);
      
      throw error;
    }
  }
  
  async submitResult(executionId, workerId, input, output, successful) {
    // Get the default account
    const accounts = await this.web3.eth.getAccounts();
    const account = accounts[0];
    
    // Submit the result to the blockchain
    await this.verifier.methods.submitExecutionResult(
      executionId,
      workerId,
      this.web3.utils.asciiToHex(JSON.stringify(input)),
      this.web3.utils.asciiToHex(JSON.stringify(output)),
      successful
    ).send({ from: account });
  }
}

// -----------------------------------------------------
// TESTING
// -----------------------------------------------------

async function testBlockchainJITEngine() {
  // Connect to a blockchain node (e.g., local Hardhat node)
  const web3 = new Web3('http://localhost:8545');
  
  // Deploy contracts
  const WorkerRegistry = await deployContract(web3, 'WorkerRegistry');
  const WorkerExecutionVerifier = await deployContract(
    web3, 
    'WorkerExecutionVerifier', 
    [WorkerRegistry.options.address]
  );
  
  // Create JIT execution node
  const jitNode = new JITExecutionNode(
    WorkerRegistry.options.address,
    WorkerExecutionVerifier.options.address,
    'http://localhost:8545'
  );
  
  // Register a worker
  const accounts = await web3.eth.getAccounts();
  const workerId = web3.utils.keccak256('worker1');
  await WorkerRegistry.methods.registerWorker(
    workerId,
    'javascript',
    'module.exports = (input) => { return input * 2; }'
  ).send({ from: accounts[0] });
  
  // Execute the worker
  const result = await jitNode.executeWorker(workerId, 5);
  console.log('Execution result:', result);
  
  // Check if the result was verified
  const executionId = web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ['bytes32', 'bytes', 'uint256'],
      [workerId, '5', Date.now()]
    )
  );
  const verified = await WorkerExecutionVerifier.methods.executionResults(executionId).call();
  console.log('Execution verified:', verified);
}

// Helper function to deploy a contract
async function deployContract(web3, contractName, args = []) {
  const accounts = await web3.eth.getAccounts();
  const Contract = require(`./build/contracts/${contractName}.json`);
  
  const contract = new web3.eth.Contract(Contract.abi);
  const deployment = contract.deploy({
    data: Contract.bytecode,
    arguments: args
  });
  
  const gas = await deployment.estimateGas();
  const instance = await deployment.send({
    from: accounts[0],
    gas
  });
  
  return instance;
}

// Run the test
testBlockchainJITEngine().catch(console.error);
