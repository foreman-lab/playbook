import { MemoryStore } from "../../../src/graph/adapters/memory-store.js";
import { runStoreContract } from "./store-contract.js";

runStoreContract("MemoryStore", () => new MemoryStore());
