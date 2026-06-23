from app.services.github_service import GitHubService
import asyncio

async def test():
    gh = GitHubService(platform='android')
    res = gh.trigger_pipeline({'APP_NAME': 'Test'})
    print(res)

if __name__ == "__main__":
    asyncio.run(test())
