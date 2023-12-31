const dgram = require("dgram");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
//
 const udpSocket = dgram.createSocket("udp4");
 udpSocket.bind(2053, "127.0.0.1");

function encodeDomainName(domain) {
  const labels = domain.split('.');
  const buffer = Buffer.alloc(domain.length + 2);
  let offset = 0;

  labels.forEach(label => {
    buffer.writeUInt8(label.length, offset++);
    buffer.write(label, offset);
    offset += label.length;
  });

  buffer.writeUInt8(0, offset);
  return buffer;
}

function encodeIPAddress(ipAddress) {
    const parts = ipAddress.split('.');
    const buffer = Buffer.alloc(4);

    parts.forEach((part, index) => {
        buffer.writeUInt8(parseInt(part), index);
    });

    return buffer;
}

udpSocket.on("message", (buf, rinfo) => {
   try {
     const id = buf.readUInt16BE(0);
     const flags = buf.readUInt16BE(2);
     const opcode = (flags & 0b0111100000000000) >> 11; // Extract Opcode from flags

     const header = Buffer.alloc(12);

     header.writeUInt16BE(0x04D2, 0);

     header[2] |= 0b10000000;

     header.writeUInt16BE(id, 0); // Set the ID from the received packet
     header.writeUInt16BE(flags | 0b1000000000000000, 2);
     const domainBuffer = encodeDomainName('codecrafters.io');

     const questionBuffer = Buffer.alloc(domainBuffer.length + 4);
     domainBuffer.copy(questionBuffer);

     const typePosition = domainBuffer.length;
     const classPosition = typePosition + 2;

     // Set Type to 1 for "A" record (2 bytes)
     questionBuffer.writeUInt16BE(1, typePosition);
     // Set Class to 1 for "IN" (2 bytes)
     questionBuffer.writeUInt16BE(1, classPosition);

     // Constructing the answer section
     const answerName = encodeDomainName('codecrafters.io');
     const answerType = Buffer.alloc(2);
     answerType.writeUInt16BE(1); // Type 1 for "A" record

     const answerClass = Buffer.alloc(2);
     answerClass.writeUInt16BE(1); // Class 1 for "IN"

     const answerTTL = Buffer.alloc(4);
     answerTTL.writeUInt32BE(60); // TTL value, set to 60

     const answerLength = Buffer.alloc(2);
     answerLength.writeUInt16BE(4); // Length of RDATA (4 bytes for IPv4 address)

     const ipAddress = '8.8.8.8'; // Replace with any valid IP address
     const answerData = encodeIPAddress(ipAddress); // Encoding IP address
     const answer = Buffer.concat([answerName, answerType, answerClass, answerTTL, answerLength, answerData]);

     header.writeUInt16BE(0x0001, 4);


     header.writeUInt16BE(0x0000, 6);


     header.writeUInt16BE(0x0000, 8);


     header.writeUInt16BE(0x0000, 10);
     header.writeUInt16BE(1, 6);
     header.writeUInt16BE(opcode << 11, 2); // Set Opcode in the response header
     const dnsResponse = Buffer.concat([header, questionBuffer, answer]);

     udpSocket.send(dnsResponse, rinfo.port, rinfo.address);
   } catch (e) {
     console.log(`Error receiving data: ${e}`);
   }
 });

 udpSocket.on("error", (err) => {
   console.log(`Error: ${err}`);
 });

 udpSocket.on("listening", () => {
   const address = udpSocket.address();
   console.log(`Server listening ${address.address}:${address.port}`);
 });
