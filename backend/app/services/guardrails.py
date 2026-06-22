import re
from typing import Tuple

class IntentClassifier:
    def __init__(self):
        # Prompt injection patterns
        self.injection_patterns = [
            r"ignore\s+(?:the\s+)?previous\s+instructions",
            r"ignore\s+above\s+instructions",
            r"reveal\s+(?:your\s+)?secrets",
            r"reveal\s+(?:the\s+)?system\s+prompt",
            r"show\s+(?:the\s+)?hidden\s+prompts",
            r"show\s+system\s+instructions",
            r"override\s+system\s+prompt",
            r"you\s+are\s+now\s+a\s+different\s+agent",
            r"dan\s+mode",
            r"jailbreak",
        ]
        
        # Blocked topics patterns for WebToApp
        self.blocked_topics = {
            "revenue": [
                r"\b(?:revenue|mrr|arr|profit|earnings|sales\s+numbers|financial\s+data|cashflow|valuation)\b",
                r"how\s+much\s+money\s+did\s+webtoapp\s+make",
                r"what\s+is\s+webtoapp['s]*\s+revenue",
            ],
            "internal architecture": [
                r"\b(?:internal\s+architecture|system\s+design|infrastructure|docker-compose|postgres\s+setup|qdrant\s+configuration|server\s+ip|hosting\s+provider|vps\s+setup|network\s+topology)\b",
                r"\b(?:worker\s+node|build\s+server|automation\s+script|apk\s+builder|ipa\s+compiling|compilation\s+engine|gradle\s+build|xcodebuild)\b",
                r"how\s+is\s+webtoapp\s+hosted",
                r"what\s+database\s+does\s+webtoapp\s+use",
            ],
            "source code": [
                r"\b(?:source\s+code|github\s+repo|gitlab\s+repository|python\s+code|main\.py|chatbot\.py|show\s+code|view\s+code|codebase|implementation\s+details|android\s+template|ios\s+source|fastlane)\b",
                r"show\s+me\s+the\s+code",
                r"can\s+i\s+see\s+the\s+source",
            ],
            "api secrets": [
                r"\b(?:api\s+secret|credentials|private\s+key|jwt_secret|smtp_password|google_service_account|secret_key|stripe_secret|db_password|env\s+variables|passwords|tokens|provisioning\s+profile|keystore\s+password)\b",
                r"reveal\s+secrets",
                r"what\s+is\s+your\s+api\s+key",
            ],
            "customer data": [
                r"\b(?:customer\s+data|user\s+records|database\s+users|user\s+emails|personal\s+information|pii|credit\s+card|billing\s+details)\b",
                r"show\s+me\s+other\s+users",
                r"get\s+user\s+emails",
            ]
        }

    def is_blocked_question(self, question: str) -> Tuple[bool, str]:
        if not question or not question.strip():
            return False, ""
            
        clean_q = question.strip().lower()
        
        # 1. Check prompt injection patterns first
        for pattern in self.injection_patterns:
            if re.search(pattern, clean_q):
                return True, "Request blocked: Potential prompt injection or system prompt access attempt detected."
                
        # 2. Check blocked topics
        for topic, patterns in self.blocked_topics.items():
            for pattern in patterns:
                if re.search(pattern, clean_q):
                    return True, f"Request blocked: Inquiries about {topic} are not allowed on this assistant."
                    
        return False, ""
