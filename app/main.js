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

udpSocket.on("message", (buf, rinfo) => {
   try {
     const header = Buffer.alloc(12);

     header.writeUInt16BE(0x04D2, 0);

     header[2] |= 0b10000000;
     const questionBuffer = encodeDomainName('codecrafters.io');

     header.writeUInt16BE(0x0001, 4);


     header.writeUInt16BE(0x0000, 6);


     header.writeUInt16BE(0x0000, 8);


     header.writeUInt16BE(0x0000, 10);
     const response = Buffer.concat([header, questionBuffer]);
     udpSocket.send(response, rinfo.port, rinfo.address);
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
