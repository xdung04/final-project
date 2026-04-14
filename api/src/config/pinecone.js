// pineconeClient.js
import pkg from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const { Pinecone } = pkg; // hoặc PineconeClient (tùy version)

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX);

export default index;
