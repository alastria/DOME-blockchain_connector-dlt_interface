const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import dotenv from "dotenv";
dotenv.config();
import {
  domeEventsContractABI as domeEventsContractABI,
  domeEventsContractAddress as domeEventsContractAddress,
} from "../src/utils/const";

describe('Configure Bblockchain node', () => {
    it('should configure the session with the provided blockchain node', async () => {
        const session = {
            provider: ' {"_isProvider":true,"_events":[],"_emitted":{"block":-2},"disableCcipRead":false,"formatter":{"formats":{"transaction":{},"transactionRequest":{},"receiptLog":{},"receipt":{},"block":{},"blockWithTransactions":{},"filter":{},"filterLog":{}}},"anyNetwork":false,"_networkPromise":{},"_maxInternalBlockNumber":-1024,"_lastBlockNumber":-2,"_maxFilterBlockRange":10,"_pollingInterval":4000,"_fastQueryDate":0,"connection":{"url":"https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6"},"_nextId":42}',
            userEthereumAddress: '0xb794f5ea0ba39494ce839613fffba74279579268',
            rpcAddress: 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6',
        };
        const userEthereumAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';
        const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
        const req = { session };
        await connectToNode(rpcAddress, userEthereumAddress, req);
        expect(session.provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(session.userEthereumAddress).toBe(userEthereumAddress);
        expect(session.rpcAddress).toBe(rpcAddress);
    });
});
jest.mock('ethers');
describe('subscribeToDOMEEvents', () => {
    it('should subscribe to DOME events', () => {
      // Parámetros de ejemplo
      const eventTypes = ['eventType1', 'eventType2'];
      const rpcAddress = 'rpcAddress';
      const notificationEndpoint = 'notificationEndpoint';
  
      // Crea un objeto de evento simulado para el evento 'EventDOMEv1'
      const simulatedEvent = {
        index: 1,
        timestamp: 1234567890,
        origin: 'originAddress',
        eventType: 'eventType1',
        dataLocation: 'dataLocation1',
        metadata: [],
      };
  
      // Simula la creación del proveedor de ethers
      const mockProvider = new ethers.providers.JsonRpcProvider(rpcAddress);
  
      // Simula la creación de la instancia del contrato
      const DOMEEventsContract = new ethers.Contract('0x2BcAb3E30D0EcCd4728b48b80C92ff4E9430B3EE', [], mockProvider);
  
      // Simula la función on del contrato y ejecuta el callback con el evento simulado
      const onCallback = (index: any, timestamp: any, origin: any, eventType: any, dataLocation: any, metadata: any) => {
        // Aquí puedes realizar aserciones en función de los datos del evento simulado
        expect(eventTypes).toContain(eventType); // Verifica si el eventType está en la lista de interés
        expect(origin).toBe('originAddress'); // Verifica el origen del evento
        
   
  
      // Espía la función on del contrato para llamar al callback con el evento simulado
      const onSpy = jest.spyOn(DOMEEventsContract, 'EventDOMEv1');
      onSpy.mockImplementation((eventName, callback) => {
        if (eventName === 'EventDOMEv1') {
          onCallback(simulatedEvent.index, simulatedEvent.timestamp, simulatedEvent.origin, simulatedEvent.eventType, simulatedEvent.dataLocation, simulatedEvent.metadata);
        }
      });
  
      // Ejecuta la función para suscribirse a eventos
      subscribeToDOMEEvents(eventTypes, rpcAddress, notificationEndpoint);
  
      // Verifica que la función on haya sido llamada con el nombre correcto del evento
     expect(onSpy).toHaveBeenCalledWith('EventDOMEv1');
  
      // Restaura la función espía después de la prueba
      onSpy.mockRestore();
    }
  });
  it('publishes a DOME event to the blockchain', async () => {

      
    const eventType = 'eventType1';
    const dataLocation = 'testDataLocation';
    const relevantMetadata = ['metadata1', 'metadata2'];
    const userEthereumAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';
    const rpcAddress= 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';

    const mockProvider = new ethers.providers.JsonRpcProvider(rpcAddress);
    const mockWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, mockProvider);
    const mockContract = new ethers.Contract(domeEventsContractAddress, domeEventsContractABI, mockWallet);

    ethers.Wallet.mockImplementation(() => mockWallet);
    ethers.Contract.mockImplementation(() => mockContract);
    await publishDOMEEvent(eventType, dataLocation, relevantMetadata, userEthereumAddress, rpcAddress);

    expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(rpcAddress);
    expect(ethers.Wallet).toHaveBeenCalledWith(expect.any(String), mockProvider);
    expect(ethers.Contract).toHaveBeenCalledWith(domeEventsContractAddress, domeEventsContractABI, mockWallet);
  });
  });
