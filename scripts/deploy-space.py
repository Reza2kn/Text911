#!/usr/bin/env python3
"""Publish this source checkout as a public Hugging Face Docker Space."""
import argparse
import json
from pathlib import Path

from huggingface_hub import HfApi, CommitOperationAdd, SpaceHardware
from huggingface_hub.errors import RepositoryNotFoundError

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_DIRECTORIES = {"src", "scripts", "worker", "tests", "data", "reports", "docs", ".hf"}
ALLOWED_FILES = {"README.md", "LICENSE", "NOTICE.md", "CONTRIBUTING.md", "Dockerfile", ".dockerignore", ".gitignore", "package.json", "package-lock.json"}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-id", required=True)
    args = parser.parse_args()
    api = HfApi()
    account = api.whoami()["name"]
    namespace, separator, name = args.repo_id.partition("/")
    if not separator or namespace != account or not name:
        raise SystemExit(f"Use a repository owned by the authenticated account: {account}/SPACE_NAME")
    try:
        info = api.space_info(args.repo_id)
        if info.private or info.sdk != "docker":
            raise SystemExit("Existing repository is not a public Docker Space; review it before publishing.")
    except RepositoryNotFoundError:
        api.create_repo(repo_id=args.repo_id, repo_type="space", space_sdk="docker", space_hardware=SpaceHardware.CPU_BASIC, private=False)
    files = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if relative.parts[0] not in ALLOWED_DIRECTORIES and str(relative) not in ALLOWED_FILES:
            continue
        if any(part in {"__pycache__", ".git", "node_modules", ".venv"} for part in relative.parts):
            continue
        if path.suffix in {".pyc", ".tmp"}:
            continue
        files.append((relative.as_posix(), path))
    operations = []
    for relative, path in files:
        if relative == "README.md":
            metadata = (ROOT / ".hf/README.yaml").read_text()
            readme = f"---\n{metadata.rstrip()}\n---\n\n{path.read_text()}"
            operations.append(CommitOperationAdd(path_in_repo=relative, path_or_fileobj=readme.encode()))
        else:
            operations.append(CommitOperationAdd(path_in_repo=relative, path_or_fileobj=path))
    commit = api.create_commit(repo_id=args.repo_id, repo_type="space", operations=operations, commit_message="Publish Text911 source, Docker runtime and verification reports")
    print(json.dumps({"repo_id": args.repo_id, "commit": commit.oid, "url": f"https://huggingface.co/spaces/{args.repo_id}", "files": len(operations)}))

if __name__ == "__main__":
    main()
