<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JobDeJargon Pro - Decode Job Descriptions</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1><a href="index.html" style="text-decoration: none; color: inherit;">JobDeJargon Pro</a></h1>
                </div>
                <!-- Navigation will be dynamically updated by navigation.js -->
                <nav class="nav">
                    <!-- Default logged-out navigation (will be replaced) -->
                    <a href="index.html">Home</a>
                    <a href="signup.html" class="btn-primary">Sign Up</a>
                </nav>
            </div>
        </div>
    </header>

    <main>
        <!-- Your page content here -->
        <section class="hero">
            <div class="container">
                <h1>Decode Corporate BS. Land Your Dream Job.</h1>
                <p>Get brutally honest AI analysis of job descriptions</p>
                <a href="job-analysis.html" class="btn-primary">Analyze a Job (Free)</a>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 JobDeJargon Pro. All rights reserved.</p>
        </div>
    </footer>

    <!-- Toast notification -->
    <div id="toast" class="toast"></div>

    <!-- Load scripts in correct order -->
    <script src="js/supabase-client.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/navigation.js"></script>  <!-- ⬅️ THIS MAKES NAVIGATION DYNAMIC -->
</body>
</html>
