# ShopEasy - E-commerce Platform

A modern, full-stack e-commerce platform built with Flask (backend) and vanilla JavaScript (frontend) with MongoDB for data storage.

## Features

### 🛍️ **Customer Features**
- **User Registration & Authentication**: Secure JWT-based authentication system
- **Product Catalog**: Browse products by category with search and filtering
- **Shopping Cart**: Add/remove items, update quantities, and manage cart
- **Checkout Process**: Complete order flow with address and payment information
- **Order Management**: View order history, status, and tracking information
- **Product Details**: View detailed product information with images

### 👑 **Admin Features**
- **Dashboard**: Overview of users, products, orders, and revenue
- **Product Management**: Add, edit, delete products with image upload
- **Inventory Management**: Track stock levels and low stock alerts
- **Order Management**: View, update order status, and manage cancellations
- **Delivery Management**: Assign tracking numbers and update delivery status
- **User Management**: View and manage user accounts

### 🔧 **Technical Features**
- **GridFS Image Storage**: Efficient file storage for product images
- **JWT Authentication**: Secure token-based authentication
- **RESTful API**: Clean, well-documented API endpoints
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live cart count and notifications
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error handling and user feedback

## Tech Stack

### Backend
- **Python 3.11+**
- **Flask** - Web framework
- **Flask-JWT-Extended** - Authentication
- **Flask-PyMongo** - MongoDB integration
- **Flask-CORS** - Cross-origin resource sharing
- **Flask-Bcrypt** - Password hashing
- **PyMongo** - MongoDB driver
- **Gunicorn** - WSGI server

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript ES6+** - No frameworks for lightweight performance
- **Fetch API** - HTTP requests
- **LocalStorage** - Client-side data persistence

### Database
- **MongoDB Atlas** - Cloud database
- **GridFS** - File storage for images

### Deployment
- **Render** - Cloud hosting platform
- **Git** - Version control

## Project Structure

```
ecommersmini/
├── backend/                    # Flask backend application
│   ├── app.py                 # Main application file
│   ├── config.py              # Configuration settings
│   ├── extensions.py          # Flask extensions setup
│   ├── models/                # Database models
│   │   ├── __init__.py
│   │   ├── user_model.py
│   │   ├── product_model.py
│   │   ├── cart_model.py
│   │   └── order_model.py
│   ├── middleware/             # Middleware functions
│   │   ├── __init__.py
│   │   └── auth_middleware.py
│   ├── routes/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── auth_routes.py
│   │   ├── product_routes.py
│   │   ├── cart_routes.py
│   │   ├── order_routes.py
│   │   ├── admin_routes.py
│   │   └── image_routes.py
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile               # Render deployment config
│   ├── runtime.txt            # Python version
│   └── gunicorn.conf.py       # Gunicorn configuration
├── css/                       # Stylesheets
│   ├── global.css             # Global styles
│   ├── auth.css               # Authentication pages
│   ├── products.css           # Product pages
│   └── admin.css              # Admin panel styles
├── js/                        # JavaScript modules
│   ├── utils.js               # Utility functions
│   ├── api.js                 # API client
│   ├── auth.js                # Authentication module
│   ├── products.js            # Product module
│   ├── cart.js                # Cart module
│   ├── checkout.js            # Checkout module
│   ├── profile.js             # User profile module
│   └── admin.js               # Admin module
├── index.html                 # Homepage
├── products.html              # Product catalog
├── product-details.html       # Product details page
├── cart.html                  # Shopping cart
├── checkout.html              # Checkout flow
├── login.html                 # User login
├── register.html              # User registration
├── profile.html               # User profile
├── admin.html                 # Admin dashboard
├── admin-products.html        # Product management
├── admin-orders.html          # Order management
└── admin-deliveries.html      # Delivery management
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- MongoDB Atlas account
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ecommersmini
   ```

2. **Set up backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment setup:**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/shopdb
   JWT_SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
   ```

4. **Run the backend:**
   ```bash
   python app.py
   ```

5. **Frontend:**
   Open `index.html` in a web browser or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve -s .
   ```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/<id>` - Get specific product
- `GET /api/products/search?q=<query>` - Search products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/<id>` - Update product (admin)
- `DELETE /api/products/<id>` - Delete product (admin)
- `PUT /api/products/<id>/stock` - Update stock (admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart
- `POST /api/cart/checkout` - Checkout

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/<id>` - Get order details
- `PUT /api/orders/<id>/cancel` - Cancel order
- `PUT /api/orders/<id>/tracking` - Update tracking
- `PUT /api/orders/<id>/delivery-status` - Update delivery status

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/<id>/status` - Update order status

### Images
- `POST /api/images/upload` - Upload image
- `DELETE /api/images/<id>` - Delete image

## Deployment

### Backend Deployment (Render)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Set up on Render:**
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set build command: `cd backend && pip install -r requirements.txt`
   - Set start command: `cd backend && gunicorn app:app`
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET_KEY`: Your JWT secret key

3. **Update API URLs:**
   In `js/api.js`, update the production URL:
   ```javascript
   return 'https://your-ecommerce-backend.onrender.com';
   ```

### Frontend Deployment

The frontend can be deployed as a static site on:
- **Render Static Sites**
- **Netlify**
- **Vercel**
- **GitHub Pages**

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Both client and server-side validation
- **CORS Protection**: Controlled cross-origin requests
- **Environment Variables**: Sensitive data stored securely
- **Rate Limiting**: Protection against brute force attacks

## Development Guidelines

### Code Style
- Follow PEP 8 for Python code
- Use semantic HTML
- Follow BEM methodology for CSS classes
- Use ES6+ JavaScript features
- Write descriptive commit messages

### Best Practices
- Use environment variables for configuration
- Implement proper error handling
- Validate all user inputs
- Use HTTPS in production
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native/Flutter)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Advanced admin features
- [ ] Caching for performance

---

**ShopEasy** - Your modern e-commerce solution built with care! 🛒✨