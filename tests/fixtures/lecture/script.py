"""The SYNTHETIC Hinglish React class used to test Phase 02/03.

Narration is Roman-script Hinglish spoken by a local Windows voice (Microsoft Ravi, en-IN).
Each segment pairs what the instructor says with what happens on screen.
`*word*` marks spoken emphasis; `|` marks a deliberate pause.

Screen actions (executed in order, spread over the segment's spoken duration):
  ("show", file)                     switch editor tab
  ("type", file, line_index, text)   insert a new line and type it
  ("edit", file, line_index, new)    retype a line in place
  ("scroll", file, top_line)         smooth scroll
  ("select", file, a, b)             highlight lines a..b (inclusive)
  ("point", file, line)              move the mouse pointer to a line
  ("panel", "terminal"|"browser"|"editor")   change focus / window
  ("term", text)                     type a line in the terminal
  ("wait",)                          idle
"""

FILES = {
    "useFetch.js": [],
    "App.jsx": [
        'import { useFetch } from "./hooks/useFetch";',
        "",
        "export default function App() {",
        "  return <h1>Users</h1>;",
        "}",
    ],
    "Dockerfile": [],
    "deployment.yaml": [],
}

SEGMENTS = [
    {
        "say": "Namaste dosto! | Aaj ki class mein hum React ka ek bahut *important* concept samjhenge. | "
        "useEffect ke andar API call kaise karte hain, | aur cleanup kyun zaroori hai.",
        "do": [
            ("show", "App.jsx"),
            ("point", "App.jsx", 2),
            ("select", "App.jsx", 2, 4),
            ("wait",),
        ],
    },
    {
        "say": "Sabse pehle ek custom hook banate hain, | useFetch. | Dekho, main yahan likh raha hoon, | "
        "function useFetch, jo ek url lega.",
        "do": [
            ("show", "useFetch.js"),
            ("type", "useFetch.js", 0, 'import { useEffect, useState } from "react";'),
            ("type", "useFetch.js", 1, ""),
            ("type", "useFetch.js", 2, "export function useFetch(url) {"),
            ("type", "useFetch.js", 3, "}"),
        ],
    },
    {
        "say": "Ab do state variables chahiye, | data aur error. | Dono useState se banayenge, | initial value null.",
        "do": [
            ("type", "useFetch.js", 3, "  const [data, setData] = useState(null);"),
            ("type", "useFetch.js", 4, "  const [error, setError] = useState(null);"),
            ("type", "useFetch.js", 5, ""),
        ],
    },
    {
        "say": "Ab aata hai *main* part, | useEffect. | Yeh effect tab chalega jab component render hoga, | "
        "aur jab bhi url change hoga. | Isliye dependency array mein url daalna zaroori hai.",
        "do": [
            ("type", "useFetch.js", 6, "  useEffect(() => {"),
            ("type", "useFetch.js", 7, "  }, [url]);"),
            ("point", "useFetch.js", 7),
            ("select", "useFetch.js", 7, 7),
        ],
    },
    {
        "say": "Andar hum fetch call karenge. | fetch ek promise return karta hai, | toh hum dot then lagake "
        "response ko JSON mein convert karenge, | aur phir setData call karenge.",
        "do": [
            ("type", "useFetch.js", 7, "    fetch(url)"),
            ("type", "useFetch.js", 8, "      .then((res) => res.json())"),
            ("type", "useFetch.js", 9, "      .then(setData)"),
            ("type", "useFetch.js", 10, "      .catch(setError);"),
        ],
    },
    {
        "say": "Lekin ek *problem* hai. | Socho user ne page jaldi se chhod diya, | aur request abhi bhi chal rahi hai. | "
        "Response aayega, | aur hum ek aise component ki state update karenge jo exist hi nahi karta. | "
        "Yeh memory leak aur race condition ka reason banta hai.",
        "do": [
            ("point", "useFetch.js", 9),
            ("select", "useFetch.js", 9, 9),
            ("wait",),
            ("point", "useFetch.js", 7),
        ],
    },
    {
        "say": "Iska solution hai AbortController. | Hum ek naya AbortController banayenge, | "
        "aur uska signal fetch ko pass karenge.",
        "do": [
            ("type", "useFetch.js", 7, "    const controller = new AbortController();"),
            ("edit", "useFetch.js", 8, "    fetch(url, { signal: controller.signal })"),
            ("select", "useFetch.js", 7, 8),
        ],
    },
    {
        "say": "Aur cleanup function mein, | controller dot abort call karenge. | React yeh cleanup *automatically* "
        "chalata hai, | jab component unmount hota hai, | ya jab url badalta hai.",
        "do": [
            ("type", "useFetch.js", 12, "    return () => controller.abort();"),
            ("point", "useFetch.js", 12),
            ("select", "useFetch.js", 12, 12),
        ],
    },
    {
        "say": "Ek cheez dhyan rakhna. | Abort hone par fetch ek AbortError throw karta hai. | "
        "Isko real error ki tarah treat mat karna, | warna screen pe galat message dikhega.",
        "do": [
            (
                "edit",
                "useFetch.js",
                11,
                '      .catch((e) => e.name !== "AbortError" && setError(e));',
            ),
            ("type", "useFetch.js", 14, ""),
            ("type", "useFetch.js", 15, "  return { data, error };"),
            ("scroll", "useFetch.js", 4),
            ("select", "useFetch.js", 11, 11),
        ],
    },
    {
        "say": "Chalo ab isko App component mein use karte hain. | Hook se data nikalenge, | "
        "aur users ki list render karenge.",
        "do": [
            ("show", "App.jsx"),
            ("type", "App.jsx", 3, '  const { data, error } = useFetch("/api/users");'),
            ("type", "App.jsx", 4, "  if (error) return <p>Kuch galat ho gaya</p>;"),
            (
                "edit",
                "App.jsx",
                5,
                "  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;",
            ),
        ],
    },
    {
        "say": "Terminal mein npm run dev chalate hain, | aur browser mein check karte hain. | "
        "Dekho, users ki list aa gayi.",
        "do": [
            ("panel", "terminal"),
            ("term", "$ npm run dev"),
            ("term", "  VITE v5.4.2  ready in 298 ms"),
            ("term", "  Local:   http://localhost:5173/"),
            ("panel", "browser"),
            ("wait",),
        ],
    },
    {
        "say": "Ab baat karte hain deployment ki. | Yeh app hum Docker container mein package karenge. | "
        "Dockerfile dekho, | node ka base image, | npm install, | aur build.",
        "do": [
            ("panel", "editor"),
            ("show", "Dockerfile"),
            ("type", "Dockerfile", 0, "FROM node:22-alpine"),
            ("type", "Dockerfile", 1, "WORKDIR /app"),
            ("type", "Dockerfile", 2, "COPY package*.json ./"),
            ("type", "Dockerfile", 3, "RUN npm ci"),
            ("type", "Dockerfile", 4, "COPY . ."),
            ("type", "Dockerfile", 5, "RUN npm run build"),
            ("type", "Dockerfile", 6, 'CMD ["npm", "run", "preview"]'),
        ],
    },
    {
        "say": "Aur production mein isko Kubernetes pe deploy karte hain, | jahan teen replicas chalenge. | "
        "Agar API slow ho, | toh AbortController wala pattern aur bhi *zaroori* ho jaata hai, | "
        "kyunki users baar baar requests cancel karte rehte hain.",
        "do": [
            ("show", "deployment.yaml"),
            ("type", "deployment.yaml", 0, "apiVersion: apps/v1"),
            ("type", "deployment.yaml", 1, "kind: Deployment"),
            ("type", "deployment.yaml", 2, "metadata:"),
            ("type", "deployment.yaml", 3, "  name: users-app"),
            ("type", "deployment.yaml", 4, "spec:"),
            ("type", "deployment.yaml", 5, "  replicas: 3"),
            ("select", "deployment.yaml", 5, 5),
        ],
    },
    {
        "say": "Toh summary. | useEffect mein fetch karo, | AbortController se request cancel karo, | "
        "aur cleanup function hamesha return karo. | Agle video mein hum React Query dekhenge. | Thank you!",
        "do": [
            ("show", "useFetch.js"),
            ("scroll", "useFetch.js", 0),
            ("select", "useFetch.js", 6, 13),
            ("wait",),
        ],
    },
]

# Short Phase 03 sample: scrolling code and changing screen focus, little typing.
FOCUS_FILES = {
    "server.js": [
        'const express = require("express");',
        "const app = express();",
        "",
        "app.use(express.json());",
        "",
        "const users = [",
        '  { id: 1, name: "Asha" },',
        '  { id: 2, name: "Rohan" },',
        '  { id: 3, name: "Meera" },',
        "];",
        "",
        'app.get("/api/users", (req, res) => {',
        "  res.json(users);",
        "});",
        "",
        'app.get("/api/users/:id", (req, res) => {',
        "  const user = users.find((u) => u.id === Number(req.params.id));",
        '  if (!user) return res.status(404).json({ error: "Not found" });',
        "  res.json(user);",
        "});",
        "",
        'app.post("/api/users", (req, res) => {',
        "  const user = { id: users.length + 1, ...req.body };",
        "  users.push(user);",
        "  res.status(201).json(user);",
        "});",
        "",
        "app.listen(3000, () => {",
        '  console.log("API on http://localhost:3000");',
        "});",
    ]
    + [f"// line {i}: middleware and helpers continue here" for i in range(31, 61)],
}

FOCUS_SEGMENTS = [
    {
        "say": "Yeh hamara Express API server hai. | Upar se neeche scroll karte hain, | dekho users ka array, | "
        "aur phir GET route.",
        "do": [
            ("show", "server.js"),
            ("point", "server.js", 5),
            ("scroll", "server.js", 8),
            ("select", "server.js", 11, 13),
        ],
    },
    {
        "say": "Aur yeh dusra route, | id se ek user laata hai. | Agar user nahi mila toh 404.",
        "do": [
            ("scroll", "server.js", 12),
            ("point", "server.js", 17),
            ("select", "server.js", 17, 17),
        ],
    },
    {
        "say": "Ab terminal pe chalte hain, | server start karte hain.",
        "do": [
            ("panel", "terminal"),
            ("term", "$ node server.js"),
            ("term", "API on http://localhost:3000"),
        ],
    },
    {
        "say": "Browser mein API kholte hain, | JSON response dikh raha hai.",
        "do": [("panel", "browser"), ("wait",)],
    },
    {
        "say": "Wapas code pe, | file ke end tak scroll karte hain.",
        "do": [
            ("panel", "editor"),
            ("scroll", "server.js", 40),
            ("point", "server.js", 44),
            ("scroll", "server.js", 0),
        ],
    },
]
