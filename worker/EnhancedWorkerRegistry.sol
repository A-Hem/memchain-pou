// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Enhanced Worker Registry
 * @dev Stores worker information with language support and version control
 */
contract EnhancedWorkerRegistry is AccessControl, ReentrancyGuard {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LANGUAGE_MANAGER_ROLE = keccak256("LANGUAGE_MANAGER_ROLE");
    
    // Worker struct with enhanced metadata
    struct Worker {
        address owner;
        string language;
        string languageVersion;
        string code;
        string codeHash;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 versionCount;
        mapping(uint256 => WorkerVersion) versions;
    }
    
    // Worker version history
    struct WorkerVersion {
        string code;
        string codeHash;
        uint256 timestamp;
    }
    
    // Worker version info (for external viewing)
    struct WorkerVersionInfo {
        string code;
        string codeHash;
        uint256 timestamp;
    }
    
    // Supported language struct
    struct Language {
        string name;
        bool supported;
        string[] supportedVersions;
    }
    
    // Mappings
    mapping(bytes32 => Worker) public workers;
    mapping(string => Language) public supportedLanguages;
    string[] public languagesList;
    
    // Events
    event WorkerRegistered(bytes32 indexed workerId, address indexed owner, string language, string languageVersion);
    event WorkerUpdated(bytes32 indexed workerId, address indexed owner, uint256 version);
    event LanguageAdded(string language, string[] supportedVersions);
    event LanguageUpdated(string language, string[] supportedVersions);
    
    /**
     * @dev Constructor
     * @param admin Address of the contract admin
     */
    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(LANGUAGE_MANAGER_ROLE, admin);
        
        // Add initial supported languages
        _addLanguage("javascript", "JavaScript", ["ES2015", "ES2016", "ES2017", "ES2018", "ES2019", "ES2020"]);
        _addLanguage("typescript", "TypeScript", ["3.9", "4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"]);
    }
    
    /**
     * @dev Add a new supported language
     * @param languageId Language identifier (e.g., "javascript")
     * @param languageName Human-readable language name (e.g., "JavaScript")
     * @param supportedVersions Array of supported versions
     */
    function addLanguage(
        string memory languageId,
        string memory languageName,
        string[] memory supportedVersions
    ) public onlyRole(LANGUAGE_MANAGER_ROLE) {
        _addLanguage(languageId, languageName, supportedVersions);
    }
    
    /**
     * @dev Internal function to add a new supported language
     */
    function _addLanguage(
        string memory languageId,
        string memory languageName,
        string[] memory supportedVersions
    ) internal {
        require(bytes(languageId).length > 0, "Language ID cannot be empty");
        require(bytes(languageName).length > 0, "Language name cannot be empty");
        require(supportedVersions.length > 0, "Must provide at least one supported version");
        
        // Check if language already exists
        if (!supportedLanguages[languageId].supported) {
            languagesList.push(languageId);
        }
        
        // Update language info
        supportedLanguages[languageId] = Language({
            name: languageName,
            supported: true,
            supportedVersions: supportedVersions
        });
        
        emit LanguageAdded(languageId, supportedVersions);
    }
    
    /**
     * @dev Update supported versions for a language
     * @param languageId Language identifier
     * @param supportedVersions New array of supported versions
     */
    function updateLanguageVersions(
        string memory languageId,
        string[] memory supportedVersions
    ) public onlyRole(LANGUAGE_MANAGER_ROLE) {
        require(supportedLanguages[languageId].supported, "Language not supported");
        require(supportedVersions.length > 0, "Must provide at least one supported version");
        
        supportedLanguages[languageId].supportedVersions = supportedVersions;
        
        emit LanguageUpdated(languageId, supportedVersions);
    }
    
    /**
     * @dev Check if a language and version are supported
     * @param language Language identifier
     * @param version Language version
     * @return bool True if supported
     */
    function isLanguageVersionSupported(
        string memory language,
        string memory version
    ) public view returns (bool) {
        if (!supportedLanguages[language].supported) {
            return false;
        }
        
        string[] memory versions = supportedLanguages[language].supportedVersions;
        for (uint i = 0; i < versions.length; i++) {
            if (keccak256(bytes(versions[i])) == keccak256(bytes(version))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Register a new worker
     * @param workerId Unique worker identifier
     * @param language Language identifier
     * @param languageVersion Language version
     * @param code Worker code
     */
    function registerWorker(
        bytes32 workerId,
        string memory language,
        string memory languageVersion,
        string memory code
    ) public nonReentrant {
        require(workers[workerId].owner == address(0), "Worker already registered");
        require(supportedLanguages[language].supported, "Language not supported");
        require(isLanguageVersionSupported(language, languageVersion), "Language version not supported");
        require(bytes(code).length > 0, "Code cannot be empty");
        
        // Calculate code hash
        string memory codeHash = _calculateCodeHash(code);
        
        // Create new worker
        Worker storage worker = workers[workerId];
        worker.owner = msg.sender;
        worker.language = language;
        worker.languageVersion = languageVersion;
        worker.code = code;
        worker.codeHash = codeHash;
        worker.createdAt = block.timestamp;
        worker.updatedAt = block.timestamp;
        worker.versionCount = 1;
        
        // Store initial version
        worker.versions[1] = WorkerVersion({
            code: code,
            codeHash: codeHash,
            timestamp: block.timestamp
        });
        
        emit WorkerRegistered(workerId, msg.sender, language, languageVersion);
    }
    
    /**
     * @dev Update an existing worker
     * @param workerId Worker identifier
     * @param language New language (can be the same as before)
     * @param languageVersion New language version
     * @param code New worker code
     */
    function updateWorker(
        bytes32 workerId,
        string memory language,
        string memory languageVersion,
        string memory code
    ) public nonReentrant {
        Worker storage worker = workers[workerId];
        require(worker.owner == msg.sender, "Not the worker owner");
        require(supportedLanguages[language].supported, "Language not supported");
        require(isLanguageVersionSupported(language, languageVersion), "Language version not supported");
        require(bytes(code).length > 0, "Code cannot be empty");
        
        // Calculate code hash
        string memory codeHash = _calculateCodeHash(code);
        
        // Update worker
        worker.language = language;
        worker.languageVersion = languageVersion;
        worker.code = code;
        worker.codeHash = codeHash;
        worker.updatedAt = block.timestamp;
        worker.versionCount++;
        
        // Store new version
        worker.versions[worker.versionCount] = WorkerVersion({
            code: code,
            codeHash: codeHash,
            timestamp: block.timestamp
        });
        
        emit WorkerUpdated(workerId, msg.sender, worker.versionCount);
    }
    
    /**
     * @dev Get worker information
     * @param workerId Worker identifier
     * @return owner Worker owner address
     * @return language Worker language
     * @return languageVersion Worker language version
     * @return code Worker code
     * @return codeHash Worker code hash
     * @return createdAt Worker creation timestamp
     * @return updatedAt Worker last update timestamp
     * @return versionCount Number of versions
     */
    function getWorker(bytes32 workerId) public view returns (
        address owner,
        string memory language,
        string memory languageVersion,
        string memory code,
        string memory codeHash,
        uint256 createdAt,
        uint256 updatedAt,
        uint256 versionCount
    ) {
        Worker storage worker = workers[workerId];
        require(worker.owner != address(0), "Worker not found");
        
        return (
            worker.owner,
            worker.language,
            worker.languageVersion,
            worker.code,
            worker.codeHash,
            worker.createdAt,
            worker.updatedAt,
            worker.versionCount
        );
    }
    
    /**
     * @dev Get worker version information
     * @param workerId Worker identifier
     * @param version Version number
     * @return WorkerVersionInfo Version information
     */
    function getWorkerVersion(bytes32 workerId, uint256 version) public view returns (WorkerVersionInfo memory) {
        Worker storage worker = workers[workerId];
        require(worker.owner != address(0), "Worker not found");
        require(version > 0 && version <= worker.versionCount, "Invalid version");
        
        WorkerVersion storage workerVersion = worker.versions[version];
        
        return WorkerVersionInfo({
            code: workerVersion.code,
            codeHash: workerVersion.codeHash,
            timestamp: workerVersion.timestamp
        });
    }
    
    /**
     * @dev Get all supported languages
     * @return Array of language identifiers
     */
    function getAllLanguages() public view returns (string[] memory) {
        return languagesList;
    }
    
    /**
     * @dev Get supported versions for a language
     * @param languageId Language identifier
     * @return Array of supported versions
     */
    function getLanguageVersions(string memory languageId) public view returns (string[] memory) {
        require(supportedLanguages[languageId].supported, "Language not supported");
        return supportedLanguages[languageId].supportedVersions;
    }
    
    /**
     * @dev Calculate code hash
     * @param code Worker code
     * @return Hash of the code
     */
    function _calculateCodeHash(string memory code) internal pure returns (string memory) {
        return bytes32ToString(keccak256(abi.encodePacked(code)));
    }
    
    /**
     * @dev Convert bytes32 to string
     * @param data Bytes32 input
     * @return String representation of bytes32
     */
    function bytes32ToString(bytes32 data) internal pure returns (string memory) {
        bytes memory bytesString = new bytes(64);
        for (uint j = 0; j < 32; j++) {
            bytes1 char = bytes1(bytes32(uint(data) * 2 ** (8 * j)));
            bytesString[j*2] = bytes1(uint8(uint(char) / 16 + 48));
            bytesString[j*2+1] = bytes1(uint8(uint(char) % 16 + 48));
        }
        return string(bytesString);
    }
}

flowchart TD
    subgraph "Language System"
        LS[LanguageSystem] --> |defines| L1[JavaScript Engine]
        LS --> |defines| L2[TypeScript Engine]
        LS --> |expandable| L3[Future Languages]
        
        L1 --> VM1[NodeVM Sandbox]
        L2 --> TS[TypeScript Compiler] --> VM2[NodeVM Sandbox]
    end
    
    subgraph "Blockchain Components"
        WR[EnhancedWorkerRegistry] --> |stores| SW[Supported Languages]
        WR --> |manages| W[Worker Code]
        WR --> |tracks| VH[Version History]
    end
    
    subgraph "Execution Flow"
        U[User/Client] --> |1. Register worker| WR
        EN[Execution Node] --> |2. Fetch worker| WR
        EN --> |3. Get language handler| LS
        EN --> |4. Execute in sandbox| EX[Code Execution]
        EN --> |5. Submit results| VR[Result Verification]
    end
    
    classDef onchain fill:#f9f,stroke:#333,stroke-width:2px
    classDef offchain fill:#bbf,stroke:#333,stroke-width:2px
    class WR,SW,W,VH onchain
    class LS,L1,L2,L3,VM1,VM2,TS,EN,EX,VR offchain
