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

3. Create a `.env.local` file in the root directory:
  ```bash
  # Linux/macOS
  WORKSPACE_PATH=/home/YOUR_USERNAME/.cursor/extensions/cursor.chat-0.1.0/workspaces

  # Windows
  WORKSPACE_PATH=C:\Users\YOUR_USERNAME\AppData\Roaming\.cursor\extensions\cursor.chat-0.1.0\workspaces
  ```

4. Start the development server:
  ```bash
  npm run dev
  ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Finding Your Workspace Path

### Linux
The default path is:
  ```bash
  ~/.cursor/extensions/cursor.chat-0.1.0/workspaces
  ```

### macOS
The default path is:
  ```bash
  ~/Library/Application Support/.cursor/extensions/cursor.chat-0.1.0/workspaces
  ```

### Windows
The default path is:
  ```bash
  %APPDATA%\.cursor\extensions\cursor.chat-0.1.0\workspaces
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