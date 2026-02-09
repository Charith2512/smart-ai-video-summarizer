# How to Push Your Project to GitHub

## Prerequisites
1.  **GitHub Account**: You must have an account on [github.com](https://github.com/).
2.  **Git Installed**: Ensure you have Git installed (`git --version` in terminal).

## Step 0: Install Git (Required)
It seems Git is not installed or not in your system path.
1.  **Download**: Go to [git-scm.com/download/win](https://git-scm.com/download/win) and download the installer.
2.  **Install**: Run the installer. Keep all settings as default, but make sure "Git from the command line and also from 3rd-party software" is selected.
3.  **Restart**: Close your terminal (or VS Code) and reopen it to apply changes.
4.  **Verify**: Run `git --version` to confirm installation.

## Step 0.5: Managing Excluded Files (Optional)
If you have files you **do not** want to upload (like local utility scripts, secrets, or large temporary files), you list them in a file named `.gitignore`.

1.  **Check `.gitignore`**: I have already created a `.gitignore` file in your project root.
2.  **Customize**:
    - Open `.gitignore`.
    - Add the names of files or folders you want to exclude (e.g., `kill_servers.bat`, `temp/`).
    - Save the file.
3.  **Effect**: Git will now completely ignore these files. They won't be staged or pushed.

## Step 1: Create a New Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  **Repository Name**: `smart-ai-video-summarizer` (or any name you like).
3.  **Description**: "AI-powered video summarizer with highlighting capabilities."
4.  **Public/Private**: Choose your preference.
5.  **Initialize**: Do **NOT** check "Add a README file" or ".gitignore" (we already have them).
6.  Click **Create repository**.
7.  Copy the URL provided (e.g., `https://github.com/your-username/smart-ai-video-summarizer.git`).

## Step 2: Initialize Git Locally
Open your terminal in the main project folder (`.../Smart AI Video Summarizer with Text and Video Highlights`) and run:

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. Commit your changes
git commit -m "Initial commit - Smart AI Video Summarizer V1"

# 4. Rename branch to main (standard practice)
git branch -M main
```

## Step 3: Connect and Push
Replace `<YOUR_REPO_URL>` with the link you copied in Step 1.

```bash
# 5. Link your local project to GitHub
git remote add origin <YOUR_REPO_URL>

# 6. Push the code
git push -u origin main
```

## Troubleshooting
- **"Permission denied"**: Ensure you are logged in to Git (`git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`).
- **"Remote origin already exists"**: Run `git remote remove origin` and try step 5 again.
