import logging

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

# 30s request timeout so a hung Gemini call can never hold a worker forever
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=30_000),
)


def generate_text(prompt: str, system_instruction: str = None) -> str:
    """
    Sends a prompt to Gemini and returns plain text.
    Used for: explaining roadmap results, lightly parsing free-text career_goal.
    Keep prompts narrow — the app controls all real logic, Gemini only explains/parses.
    """
    try:
        config = {}
        if system_instruction:
            config["system_instruction"] = system_instruction

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=config if config else None
        )
        return response.text

    except Exception as e:
        logger.warning("Gemini API error: %s", e)
        return None  # caller must handle None -> use hardcoded fallback