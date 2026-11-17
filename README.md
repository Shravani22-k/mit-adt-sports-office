# MIT-ADT Sports Office

A web-based sports event registration and management platform prototype for MIT-ADT University. The application provides separate workspaces for students, sports heads, and administrators to support sports event activities.

## About the Project

MIT-ADT Sports Office is developed to provide a centralized interface for managing university sports activities. It is designed around three user roles:

- **Students:** A dedicated workspace for student users to access sports-related activities.
- **Sports Heads:** A separate workspace for sports heads to manage their event-related activities.
- **Administrators:** An administrative workspace for managing the platform.

The project currently focuses on the frontend interface and role-based navigation.

## Key Features

- Separate sign-in interface for different user roles.
- Student, Sports Head, and Administrator workspaces.
- Role-based navigation between dashboards.
- Responsive user interface.
- Sports event registration and management interface.
- Sports-related information such as fixtures, standings, and entry passes.

## Technologies Used

| Technology | Purpose |
|---|---|
| React | Frontend development |
| TypeScript | Type-safe JavaScript |
| Vite | Development server and build tool |
| React Router | Application navigation |
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| npm | Package management |

## Project Structure

```text
mit-adt-sports-office/
│
├── public/
│
├── src/
│   ├── main.tsx
│   └── ui/
│       ├── App.tsx
│       └── styles.css
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.js
├── .gitignore
└── README.md
```

## Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Shravani22-k/mit-adt-sports-office.git
```

### 2. Navigate to the Project Folder

```bash
cd mit-adt-sports-office
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open the Application

Open the local URL displayed in your terminal. Vite usually runs the application at:

```text
http://localhost:5173
```

## Available Commands

| Command | Description |
|---|---|
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run preview` | Previews the production build |

## Demo Login Information

This project currently uses prototype sign-in behavior.

- Select a user role on the sign-in page.
- Enter any non-empty ID/email and password.
- The selected workspace will open.
- Use the sign-out option to switch between roles.

**Note:** This is a frontend prototype. The sign-in functionality is not connected to production authentication. Real account verification, payment processing, and persistent data storage require backend integration.

## Future Enhancements

- Backend integration and database connectivity.
- Secure user authentication and authorization.
- Online sports event registration.
- Payment gateway integration.
- Fixture and match scheduling management.
- Live score and standings updates.
- Admin controls and report generation.

## Project Purpose

This project demonstrates the development of a role-based university sports management interface using modern frontend technologies. It provides a foundation for building a complete sports event registration and management system.

## Author

**Shravani Kharade**

GitHub: [Shravani22-k](https://github.com/Shravani22-k)

---

*Developed as a university project for MIT-ADT University.*
