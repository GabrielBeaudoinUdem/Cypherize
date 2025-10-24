# Cypherize

An interactive graph exploration application powered by artificial intelligence.
The user can import unstructured data (text, CSV, JSON, etc.), which is then processed by an AI to be converted into a KuzuDB graph database.
The interface allows direct interaction with the graph, asking questions in natural language, or executing Cypher queries directly.

See the demo: [video](./demo.mov)

---

## Technologies Used

| Domain       | Technology                       |
| ------------ | -------------------------------- |
| **App**      | [Next.js](https://nextjs.org)    |
| **Database** | [Kuzu](https://kuzudb.com)       |
| **AI**       | [LM studio](https://lmstudio.ai/)|

---

## Installation & Running

### 1. Clone the project

```bash
git clone https://github.com/GabrielBeaudoinUdem/Cypherize.git
cd Cypherize
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see it in action.