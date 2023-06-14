console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  ContractCreateFlow,
  PublicKey,
  ContractId
} = require("@hashgraph/sdk");
const fs = require("fs");

// 1. Create our connection to the Hedera network
const OEMId = AccountId.fromString(process.env.MY_ACCOUNT_ID1);
const OEMKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY1);
const OEMPubKey = OEMKey.publicKey.toEvmAddress();
const OEM = Client.forTestnet().setOperator(OEMId, OEMKey);

const MODEL_AId = AccountId.fromString(process.env.MY_ACCOUNT_ID2);
const MODEL_AKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY2);
const MODEL_APubKey = MODEL_AKey.publicKey.toEvmAddress();
const MODEL_A = Client.forTestnet().setOperator(MODEL_AId, MODEL_AKey);

const MODEL_BId = AccountId.fromString(process.env.MY_ACCOUNT_ID3);
const MODEL_BKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY3);
const MODEL_BPubKey = MODEL_BKey.publicKey.toEvmAddress();
const MODEL_B = Client.forTestnet().setOperator(MODEL_BId, MODEL_BKey);

const MODEL_CId = AccountId.fromString(process.env.MY_ACCOUNT_ID4);
const MODEL_CKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY4);
const MODEL_CPubKey = MODEL_CKey.publicKey.toEvmAddress();
const MODEL_C = Client.forTestnet().setOperator(MODEL_CId, MODEL_CKey);

// 2. Create the file we will store the contract in
const byteCode = fs.readFileSync("./Smart_Contract_Binary/SecureUpdate_sol_SecureUpdate.bin");

// 3. Create the contract
async function contractDeployment(){
    // Deploy the contract
    console.log("Contract Deployment");
    const createContractTx = new ContractCreateFlow()
      .setBytecode(byteCode)
      .setGas(10000000)
      .setConstructorParameters(new ContractFunctionParameters());
    const createContractTxResponse = await createContractTx.execute(OEM);
    const createContractReceipt = await createContractTxResponse.getReceipt(OEM);
    const contractId = await createContractReceipt.contractId;
    console.log("Contract Id:", contractId.toString());

    // Adding one vehicle of each type to the contract
    const contractAddVehicleA = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(10000000)
        .setFunction("addVehicle", new ContractFunctionParameters().addUint8(1).addAddress(MODEL_APubKey));
    const contractAddVehicleAResponse = await contractAddVehicleA.execute(OEM);

    const contractAddVehicleB = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(10000000)
        .setFunction("addVehicle", new ContractFunctionParameters().addUint8(2).addAddress(MODEL_BPubKey));
    const contractAddVehicleBResponse = await contractAddVehicleB.execute(OEM);

    const contractAddVehicleC = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(10000000)
        .setFunction("addVehicle", new ContractFunctionParameters().addUint8(3).addAddress(MODEL_CPubKey));
    const contractAddVehicleCResponse = await contractAddVehicleC.execute(OEM);

    return contractId;
}

async function contractValidation(contractId){
    console.log("Contract Validation");

    const contractAddUpdate = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("addUpdate", new ContractFunctionParameters().addString("Hi1").addString("Hi2").addString("Hi3").addString("Hi4").addUint8(1));
    const contractAddUpdateResponse = await contractAddUpdate.execute(OEM);
    const contractAddUpdateReceipt = await contractAddUpdateResponse.getReceipt(OEM);
    console.log("Update added to Model A");

    const contractHasUpdate = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("hasUpdate", new ContractFunctionParameters().addUint8(1));
    const contractHasUpdateResponse = await contractHasUpdate.execute(MODEL_A);
    const modelAHasUpdate = contractHasUpdateResponse.getBool(0);
    console.log("Vehicle A has update:", modelAHasUpdate);

    const contractGetUpdate = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("fetchUpdate", new ContractFunctionParameters().addUint8(1));
    const contractGetUpdateResponse = await contractGetUpdate.execute(MODEL_A);
    const modelAKey = contractGetUpdateResponse.getString(0);
    console.log("Vehicle A Key:", modelAKey);
    const modelAChecksum = contractGetUpdateResponse.getString(1);
    console.log("Vehicle A update hash:", modelAChecksum);
    const modelACID = contractGetUpdateResponse.getString(2);
    console.log("Vehicle A CID:", modelACID);
    const modelAHasUpdateVersion = contractGetUpdateResponse.getString(3);
    console.log("Vehicle A has update version:", modelAHasUpdateVersion);

    const contractSendUpdateStatus = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("updateUpdateStatus", new ContractFunctionParameters().addUint8(1).addBool(false));
    const contractSendUpdateStatusResponse = await contractSendUpdateStatus.execute(MODEL_A);
    const contractSendUpdateStatusReceipt = await contractSendUpdateStatusResponse.getReceipt(MODEL_A);
    console.log("Update status sent to Model A");

    // Call to verify update can be called again
    const contractGetUpdate1 = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000)
      .setFunction("fetchUpdate", new ContractFunctionParameters().addUint8(1));
    const contractGetUpdateResponse1 = await contractGetUpdate1.execute(MODEL_A);
    const modelAKey1 = contractGetUpdateResponse1.getString(0);
    console.log("Vehicle A Key:", modelAKey);
    const modelAChecksum1 = contractGetUpdateResponse1.getString(1);
    console.log("Vehicle A update hash:", modelAChecksum1);
    const modelACID1 = contractGetUpdateResponse1.getString(2);
    console.log("Vehicle A CID:", modelACID1);
    const modelAHasUpdateVersion1 = contractGetUpdateResponse1.getString(3);
    console.log("Vehicle A has update version:", modelAHasUpdateVersion1);

    // Change Update Status to true
    const contractSendUpdateStatus1 = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction(
        "updateUpdateStatus",
        new ContractFunctionParameters().addUint8(1).addBool(true)
      );
    const contractSendUpdateStatusResponse1 =
      await contractSendUpdateStatus1.execute(MODEL_A);
    const contractSendUpdateStatusReceipt1 =
      await contractSendUpdateStatusResponse1.getReceipt(MODEL_A);
    console.log("Update status sent to Model A");

    // Expect failure here
    const contractGetUpdate2 = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000)
      .setFunction("fetchUpdate", new ContractFunctionParameters().addUint8(1));
    const contractGetUpdateResponse2 = await contractGetUpdate1.execute(
      MODEL_A
    );
    const modelAKey2 = contractGetUpdateResponse2.getString(0);
    console.log("Vehicle A Key:", modelAKey2);
    const modelAChecksum2 = contractGetUpdateResponse2.getString(1);
    console.log("Vehicle A update hash:", modelAChecksum2);
    const modelACID2 = contractGetUpdateResponse2.getString(2);
    console.log("Vehicle A CID:", modelACID2);
    const modelAHasUpdateVersion2 = contractGetUpdateResponse2.getString(3);
    console.log("Vehicle A has update version:", modelAHasUpdateVersion2);
}

async function main(){
    const deployedContractId = await contractDeployment();
    contractValidation(deployedContractId);
}
main();







