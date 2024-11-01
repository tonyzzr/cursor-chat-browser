# Cursor Chat Browser

A web application for browsing and managing chat histories from the Cursor editor's AI chat feature. View, search, and export your AI conversations in various formats.

## Features

- 🔍 Browse all workspaces with Cursor chat history
- 📁 Organize chats by workspace
- 📱 Responsive design with dark/light mode support
- ⬇️ Export chats as:
  - Markdown files
  - HTML documents (with syntax highlighting)
  - PDF documents
- 🎨 Syntax highlighted code blocks
- 📌 Bookmarkable chat URLs

## Prerequisites

- Node.js 18+ and npm
- A Cursor editor installation with chat history

## Installation

1. Clone the repository:
  ```bash
  git clone https://github.com/thomas-pedersen/cursor-chat-browser.git
  cd cursor-chat-browser
  ```

2. Install dependencies:
  ```bash
  npm install
  ```

3. Create a `.env.local` file in the root directory with the appropriate path for your system:

### Windows (native)
  ```bash
  WORKSPACE_PATH=C:\Users\YOUR_USERNAME\AppData\Roaming\Cursor\User\workspaceStorage
  ```

### Windows (WSL2)
  ```bash
  WORKSPACE_PATH=/mnt/c/Users/YOUR_USERNAME/AppData/Roaming/Cursor/User/workspaceStorage
  ```

### macOS
  ```bash
  WORKSPACE_PATH=~/Library/Application Support/Cursor/User/workspaceStorage
  ```

### Linux
  ```bash
  WORKSPACE_PATH=~/.config/Cursor/User/workspaceStorage
  ```

4. Start the development server:
  ```bash
  npm run dev
  ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Finding Your Workspace Path

The location of your Cursor chat history depends on your operating system and setup:

### Windows (native)
The default path is in your AppData folder:
  ```
  C:\Users\YOUR_USERNAME\AppData\Roaming\Cursor\User\workspaceStorage
  ```

### Windows (WSL2)
When running under WSL2, you need to use the mounted Windows path:
  ```
  /mnt/c/Users/YOUR_USERNAME/AppData/Roaming/Cursor/User/workspaceStorage
  ```
Note: Replace `YOUR_USERNAME` with your actual Windows username, not your WSL username.

### macOS
The default path is:
  ```
  ~/Library/Application Support/Cursor/User/workspaceStorage
  ```

### Linux
The default path is:
  ```
  ~/.config/Cursor/User/workspaceStorage
  ```

## Development

Built with:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- SQLite for reading Cursor's chat database

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.