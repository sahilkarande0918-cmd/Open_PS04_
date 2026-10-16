"""Technical-vocabulary correction for ASR words.

Deterministic and conservative: a word is changed only when it matches a known spoken form of a
term (built-in dictionary, the institute's glossary, or tokens seen on screen), or is a near-exact
misspelling of a distinctive term. Raw text is never modified; every change records its source.
"""

import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher

# term -> spoken/ASR variants (lowercase, space separated tokens). The term itself is matched too.
BUILTIN: dict[str, list[str]] = {
    "Kubernetes": ["kubernetes", "cubernetes", "kuber netes", "kubernetis", "cuber netis", "k8s"],
    "kubectl": ["kube ctl", "cube ctl", "kube control", "cube control", "kubectl"],
    "useEffect": ["use effect", "useeffect", "use affect", "yuz effect"],
    "useState": ["use state", "usestate"],
    "useRef": ["use ref", "useref"],
    "useMemo": ["use memo", "usememo"],
    "useCallback": ["use callback", "use call back", "usecallback"],
    "useContext": ["use context", "usecontext"],
    "setState": ["set state"],
    "AbortController": ["abort controller", "abortcontroller"],
    "AbortError": ["abort error", "aborterror"],
    "fetch": ["fetch"],
    "@Autowired": [
        "at the rate autowired",
        "at the rate auto wired",
        "at autowired",
        "at auto wired",
        "autowired",
        "auto wired",
    ],
    "@Component": ["at the rate component", "at component"],
    "@RestController": ["at the rate rest controller", "at rest controller"],
    "@Override": ["at the rate override", "at override"],
    "JavaScript": ["javascript", "java script"],
    "TypeScript": ["typescript", "type script"],
    "React": ["react", "react js", "reactjs"],
    "Next.js": ["next js", "nextjs", "next dot js"],
    "Node.js": ["node js", "nodejs", "node dot js"],
    "Express.js": ["express js", "expressjs"],
    "Docker": ["docker", "dokar", "doker"],
    "Dockerfile": ["docker file", "dockerfile"],
    "JSON": ["json", "jason", "j son", "jay son"],
    "XML": ["xml", "x m l"],
    "API": ["api", "a p i"],
    "REST API": ["rest api", "restful api"],
    "SQL": ["sql", "s q l"],
    "MySQL": ["my sql", "mysql", "my sequel"],
    "PostgreSQL": ["postgres sql", "postgresql", "postgre sql", "postgres"],
    "MongoDB": ["mongo db", "mongodb", "mongo d b"],
    "Python": ["python"],
    "C++": ["c plus plus", "cpp", "c p p", "see plus plus"],
    "C#": ["c sharp", "see sharp"],
    "Java": ["java"],
    "Spring Boot": ["spring boot", "springboot"],
    "GitHub": ["github", "git hub"],
    "Git": ["git"],
    "npm": ["npm", "n p m"],
    "HTML": ["html", "h t m l"],
    "CSS": ["css", "c s s"],
    "Tailwind": ["tailwind", "tail wind"],
    "async": ["async", "a sync"],
    "await": ["await"],
    "localhost": ["local host", "localhost"],
    "DOM": ["dom", "d o m"],
    "props": ["props", "prop s"],
    "JSX": ["jsx", "j s x"],
    "AWS": ["aws", "a w s"],
    "CI/CD": ["ci cd", "c i c d", "cicd"],
    "YAML": ["yaml", "yamel", "yaml file"],
    "Redux": ["redux", "re dux"],
    "GraphQL": ["graph ql", "graphql", "graph q l"],
    "Linux": ["linux"],
    "OOP": ["oop", "o o p"],
    "DSA": ["dsa", "d s a"],
}

# Only terms at least this distinctive are eligible for fuzzy matching (avoids "react" -> "React" on "reach").
_FUZZY_MIN_LEN = 7
_FUZZY_RATIO = 0.88
_STRIP = re.compile(r"^[^\w@#+.]+|[^\w@#+]+$")


def _norm(token: str) -> str:
    return _STRIP.sub("", token).lower()


@dataclass
class Glossary:
    variants: dict[tuple[str, ...], str] = field(default_factory=dict)  # token tuple -> term
    max_len: int = 1
    fuzzy_terms: dict[str, str] = field(default_factory=dict)  # normalized single-token -> term

    def add(self, term: str, aliases: list[str] = (), source: str = "builtin") -> None:
        for spoken in {term.lower(), *[a.lower() for a in aliases]}:
            toks = tuple(_norm(t) for t in spoken.split() if _norm(t))
            if toks:
                self.variants[toks] = term
                self.max_len = max(self.max_len, len(toks))
        # Fuzzy matching only for plain identifiers: "@Component" must never swallow the word "component".
        if len(term) >= _FUZZY_MIN_LEN and re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", term):
            self.fuzzy_terms[term.lower()] = term

    @classmethod
    def build(cls, org_terms: list[dict] = (), screen_tokens: list[str] = ()) -> "Glossary":
        g = cls()
        for term, aliases in BUILTIN.items():
            g.add(term, aliases)
        for row in org_terms:
            g.add(row["term"], row.get("aliases") or [])
        for tok in screen_tokens:  # code/OCR tokens seen on screen: exact identifiers only
            if re.fullmatch(r"@?[A-Za-z_][A-Za-z0-9_.]{3,}", tok):
                g.add(tok, [re.sub(r"(?<=[a-z])(?=[A-Z])", " ", tok).lower()])
        return g

    def hotwords(self) -> str:
        """Distinct canonical terms, used to bias the decoder towards correct spellings."""
        return " ".join(sorted(set(self.variants.values()))[:120])


def correct(words: list[dict], glossary: Glossary) -> list[dict]:
    """Return words with `corrected_text` and `metadata` set. Multi-word matches collapse into the first
    word of the span (its timing is extended to the span end); the others get corrected_text ''."""
    out = [
        {**w, "corrected_text": w["raw_text"].strip(), "metadata": dict(w.get("metadata") or {})}
        for w in words
    ]
    norms = [_norm(w["raw_text"]) for w in words]
    i = 0
    while i < len(out):
        match = None
        for n in range(min(glossary.max_len, len(out) - i), 0, -1):
            key = tuple(norms[i : i + n])
            if all(key) and key in glossary.variants:
                match = (n, glossary.variants[key], "glossary")
                break
        if not match and len(norms[i]) >= _FUZZY_MIN_LEN:
            best = max(
                glossary.fuzzy_terms, key=lambda k: SequenceMatcher(None, norms[i], k).ratio(), default=None
            )
            if best and best != norms[i] and SequenceMatcher(None, norms[i], best).ratio() >= _FUZZY_RATIO:
                match = (1, glossary.fuzzy_terms[best], "fuzzy")
        if match:
            n, term, src = match
            trailing = re.search(r"[,.?!:;]+$", out[i + n - 1]["raw_text"].strip())
            fixed = term + (trailing.group(0) if trailing else "")
            if fixed != out[i]["corrected_text"] or n > 1:
                out[i]["corrected_text"] = fixed
                out[i]["metadata"]["correction"] = {"source": src, "term": term, "span": n}
                if n > 1:
                    out[i]["end_s"] = out[i + n - 1]["end_s"]
                    for j in range(i + 1, i + n):
                        out[j]["corrected_text"] = ""
                        out[j]["metadata"]["merged_into"] = out[i]["idx"]
            i += n
        else:
            i += 1
    return out
