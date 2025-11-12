# TODO: Remove Login/Signup and Make Home Page with Image Detection

- [x] Edit App.jsx: Remove authentication logic, routes for /signup and /login, remove imports for Login, Signup, ProtectedRoute, simplify routing to only / with Home, remove ImageDetector component.
- [x] Edit Home.jsx: Integrate image detection functionality (form, state, handlers) from App.jsx's ImageDetector component.
- [x] Edit Navbar.jsx: Simplify to only show brand link, remove auth-related links.
- [x] Followup: Run the frontend to verify home page loads with detection functionality.
- [x] Followup: Check that image upload and analysis work without auth.
- [x] Remove backend signup and login code: Remove signup/login endpoints, authenticateToken middleware, and make /api/analyze public.
