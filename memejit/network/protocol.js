`network/Protocol.js`
```javascript
export class JITProtocol {
  static encode(message) {
    const header = Buffer.alloc(5);
    header.writeUInt8(0x1A); // Magic byte
    header.writeUInt32BE(message.type, 1);
    
    const payload = Buffer.from(JSON.stringify(message.data));
    return Buffer.concat([header, payload]);
  }

  static decode(buffer) {
    return {
      type: buffer.readUInt32BE(1),
      data: JSON.parse(buffer.slice(5).toString())
    };
  }
}
```