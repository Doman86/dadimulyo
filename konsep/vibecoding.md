```json
{
  "project": {
    "name": "Dadi Mulyo Digital Platform",
    "short_name": "Dadi Mulyo",
    "version": "1.0.0",
    "status": "development",
    "business_location": "Wagir, Kabupaten Malang, Jawa Timur, Indonesia",
    "business_type": [
      "truck showroom",
      "truck sales",
      "truck rental",
      "orange marketplace",
      "truck delivery",
      "agricultural product commerce"
    ],
    "main_goal": "Membangun platform digital untuk mendukung bisnis Dadi Mulyo dalam menampilkan, menjual, menyewakan truck, menjual buah jeruk, menerima calon pelanggan, mengelola transaksi, dan mengatur pengiriman.",
    "development_priority": "Fokus pada sistem yang stabil, mudah dikembangkan, mudah dipelihara, dan kompatibel dengan shared hosting.",
    "important_context": {
      "development_environment": "local computer",
      "temporary_deployment_target": "shared hosting",
      "future_deployment": "shared hosting terlebih dahulu",
      "cloud_storage_required": false,
      "s3_required": false,
      "vps_required": false,
      "docker_required": false,
      "kubernetes_required": false
    }
  },

  "technology_stack": {
    "backend": {
      "framework": "Laravel",
      "architecture": "REST API",
      "authentication": "Laravel Sanctum",
      "language": "PHP",
      "database": "MySQL"
    },
    "web": {
      "framework": "React.js",
      "css": "Tailwind CSS",
      "api_client": "Axios",
      "state_management": "React Context initially",
      "routing": "React Router"
    },
    "mobile": {
      "framework": "Flutter",
      "language": "Dart",
      "api_client": "Dio or http",
      "state_management": "Provider initially"
    },
    "development": {
      "local_server": "Laragon",
      "web_server": "Apache",
      "database_server": "MySQL",
      "editor": "Visual Studio Code"
    }
  },

  "architecture": {
    "type": "separated_frontend_backend",
    "structure": {
      "backend": "Laravel REST API",
      "web": "React + Tailwind",
      "mobile": "Flutter",
      "database": "MySQL"
    },
    "communication": {
      "web_to_backend": "REST API",
      "mobile_to_backend": "REST API",
      "format": "JSON",
      "authentication": "Sanctum token"
    }
  },

  "repository_structure": {
    "root": "DADI-MULYO",
    "directories": [
      "backend",
      "web",
      "mobile",
      "database",
      "docs"
    ],
    "documentation": {
      "directory": "docs",
      "files": [
        "00-master-context.json",
        "01-business.json",
        "02-roles.json",
        "03-features.json",
        "04-database.json",
        "05-api.json",
        "06-web.json",
        "07-mobile.json",
        "08-ui-ux.json",
        "09-security.json",
        "10-storage.json",
        "11-deployment.json",
        "12-vibe-coding.json",
        "13-roadmap.json"
      ]
    }
  },

  "business_modules": {
    "truck_showroom": {
      "priority": "critical",
      "description": "Digital showroom untuk menampilkan truck yang tersedia untuk dijual.",
      "features": [
        "truck listing",
        "truck detail",
        "multiple truck images",
        "truck specifications",
        "truck category",
        "brand",
        "model",
        "year",
        "price",
        "mileage",
        "engine",
        "transmission",
        "fuel_type",
        "capacity",
        "condition",
        "location",
        "availability status",
        "search",
        "filter",
        "sorting",
        "wishlist",
        "compare truck",
        "contact sales",
        "request offer"
      ]
    },

    "truck_sales": {
      "priority": "critical",
      "features": [
        "customer inquiry",
        "sales lead",
        "request price",
        "request negotiation",
        "sales follow-up",
        "customer notes",
        "lead status",
        "sales assignment"
      ]
    },

    "truck_rental": {
      "priority": "high",
      "features": [
        "rental truck listing",
        "rental price",
        "daily rental",
        "weekly rental",
        "availability calendar",
        "booking",
        "rental status",
        "customer data",
        "rental history",
        "booking confirmation"
      ]
    },

    "orange_marketplace": {
      "priority": "high",
      "description": "Marketplace khusus produk jeruk.",
      "features": [
        "orange product listing",
        "orange categories",
        "orange grade",
        "price per kilogram",
        "wholesale price",
        "stock",
        "minimum order",
        "harvest schedule",
        "farm location",
        "product images",
        "pre-order",
        "bulk order"
      ]
    },

    "order_system": {
      "priority": "high",
      "features": [
        "cart",
        "checkout",
        "order creation",
        "order items",
        "order status",
        "order history",
        "invoice",
        "payment status"
      ]
    },

    "delivery": {
      "priority": "medium",
      "description": "Sistem pengiriman yang menghubungkan pesanan jeruk dengan truck.",
      "features": [
        "delivery request",
        "truck selection",
        "delivery address",
        "estimated shipping cost",
        "delivery status",
        "driver assignment",
        "delivery history"
      ]
    },

    "review": {
      "priority": "medium",
      "features": [
        "truck review",
        "seller review",
        "rental review",
        "orange product review"
      ]
    },

    "wishlist": {
      "priority": "medium",
      "features": [
        "save truck",
        "remove truck",
        "saved products"
      ]
    },

    "notification": {
      "priority": "medium",
      "features": [
        "order notification",
        "rental notification",
        "lead notification",
        "system notification"
      ]
    }
  },

  "user_roles": {
    "admin": {
      "permissions": [
        "manage users",
        "manage trucks",
        "manage truck categories",
        "manage rentals",
        "manage orange products",
        "manage orders",
        "manage deliveries",
        "manage reviews",
        "manage leads",
        "manage reports",
        "manage system settings"
      ]
    },

    "sales": {
      "permissions": [
        "view leads",
        "manage customers",
        "follow up customers",
        "view trucks",
        "manage assigned truck listings",
        "update lead status",
        "record customer notes"
      ]
    },

    "truck_seller": {
      "permissions": [
        "create truck",
        "edit truck",
        "delete truck",
        "upload truck images",
        "manage truck specifications",
        "manage truck price",
        "view truck inquiries"
      ]
    },

    "orange_seller": {
      "permissions": [
        "create orange product",
        "edit orange product",
        "delete orange product",
        "manage stock",
        "manage price",
        "manage product images",
        "manage orders"
      ]
    },

    "customer": {
      "permissions": [
        "browse trucks",
        "view truck detail",
        "wishlist truck",
        "compare trucks",
        "contact sales",
        "request offer",
        "rent truck",
        "buy oranges",
        "create orders",
        "review products",
        "view order history"
      ]
    },

    "driver": {
      "permissions": [
        "view assigned delivery",
        "view schedule",
        "update delivery status",
        "view delivery history"
      ],
      "implementation": "optional phase"
    }
  },

  "database": {
    "tables": {
      "users": [
        "id",
        "name",
        "email",
        "phone",
        "password",
        "role_id",
        "profile_image",
        "status",
        "created_at",
        "updated_at"
      ],

      "roles": [
        "id",
        "name",
        "created_at",
        "updated_at"
      ],

      "truck_categories": [
        "id",
        "name",
        "description",
        "created_at",
        "updated_at"
      ],

      "trucks": [
        "id",
        "category_id",
        "seller_id",
        "brand",
        "model",
        "year",
        "price",
        "mileage",
        "engine",
        "transmission",
        "fuel_type",
        "capacity",
        "condition",
        "description",
        "location",
        "status",
        "is_for_sale",
        "is_for_rent",
        "created_at",
        "updated_at"
      ],

      "truck_images": [
        "id",
        "truck_id",
        "image_path",
        "is_primary",
        "sort_order",
        "created_at",
        "updated_at"
      ],

      "truck_specifications": [
        "id",
        "truck_id",
        "key",
        "value",
        "created_at",
        "updated_at"
      ],

      "rentals": [
        "id",
        "truck_id",
        "customer_id",
        "start_date",
        "end_date",
        "price_per_day",
        "total_price",
        "status",
        "notes",
        "created_at",
        "updated_at"
      ],

      "orange_categories": [
        "id",
        "name",
        "description",
        "created_at",
        "updated_at"
      ],

      "orange_products": [
        "id",
        "seller_id",
        "category_id",
        "name",
        "description",
        "grade",
        "price_per_kg",
        "wholesale_price",
        "stock_kg",
        "minimum_order_kg",
        "harvest_date",
        "farm_location",
        "status",
        "created_at",
        "updated_at"
      ],

      "orange_images": [
        "id",
        "orange_product_id",
        "image_path",
        "is_primary",
        "sort_order",
        "created_at",
        "updated_at"
      ],

      "addresses": [
        "id",
        "user_id",
        "label",
        "recipient_name",
        "phone",
        "address",
        "village",
        "district",
        "city",
        "province",
        "postal_code",
        "latitude",
        "longitude",
        "created_at",
        "updated_at"
      ],

      "orders": [
        "id",
        "customer_id",
        "order_number",
        "subtotal",
        "shipping_cost",
        "total",
        "status",
        "payment_status",
        "shipping_address_id",
        "notes",
        "created_at",
        "updated_at"
      ],

      "order_items": [
        "id",
        "order_id",
        "orange_product_id",
        "quantity_kg",
        "price_per_kg",
        "subtotal",
        "created_at",
        "updated_at"
      ],

      "payments": [
        "id",
        "order_id",
        "payment_method",
        "amount",
        "status",
        "paid_at",
        "created_at",
        "updated_at"
      ],

      "deliveries": [
        "id",
        "order_id",
        "truck_id",
        "driver_id",
        "pickup_address",
        "destination_address",
        "shipping_cost",
        "status",
        "scheduled_at",
        "delivered_at",
        "notes",
        "created_at",
        "updated_at"
      ],

      "wishlists": [
        "id",
        "user_id",
        "truck_id",
        "created_at",
        "updated_at"
      ],

      "reviews": [
        "id",
        "user_id",
        "truck_id",
        "orange_product_id",
        "rating",
        "review",
        "status",
        "created_at",
        "updated_at"
      ],

      "leads": [
        "id",
        "customer_id",
        "sales_id",
        "truck_id",
        "name",
        "phone",
        "message",
        "status",
        "source",
        "notes",
        "created_at",
        "updated_at"
      ],

      "notifications": [
        "id",
        "user_id",
        "title",
        "message",
        "type",
        "read_at",
        "created_at",
        "updated_at"
      ]
    }
  },

  "api": {
    "base_url": "/api",
    "response_format": "JSON",

    "authentication": [
      "POST /api/register",
      "POST /api/login",
      "POST /api/logout",
      "GET /api/user"
    ],

    "trucks": [
      "GET /api/trucks",
      "POST /api/trucks",
      "GET /api/trucks/{id}",
      "PUT /api/trucks/{id}",
      "DELETE /api/trucks/{id}",
      "POST /api/trucks/{id}/images",
      "DELETE /api/trucks/{id}/images/{image}",
      "POST /api/trucks/{id}/wishlist"
    ],

    "rentals": [
      "GET /api/rentals",
      "POST /api/rentals",
      "GET /api/rentals/{id}",
      "PUT /api/rentals/{id}",
      "DELETE /api/rentals/{id}"
    ],

    "orange_products": [
      "GET /api/oranges",
      "POST /api/oranges",
      "GET /api/oranges/{id}",
      "PUT /api/oranges/{id}",
      "DELETE /api/oranges/{id}"
    ],

    "orders": [
      "GET /api/orders",
      "POST /api/orders",
      "GET /api/orders/{id}",
      "PUT /api/orders/{id}/status"
    ],

    "delivery": [
      "GET /api/deliveries",
      "POST /api/deliveries",
      "GET /api/deliveries/{id}",
      "PUT /api/deliveries/{id}/status"
    ],

    "leads": [
      "GET /api/leads",
      "POST /api/leads",
      "GET /api/leads/{id}",
      "PUT /api/leads/{id}",
      "DELETE /api/leads/{id}"
    ]
  },

  "web_pages": {
    "public": [
      "/",
      "/about",
      "/trucks",
      "/trucks/{id}",
      "/rental",
      "/oranges",
      "/oranges/{id}",
      "/contact",
      "/faq"
    ],

    "customer": [
      "/dashboard",
      "/wishlist",
      "/cart",
      "/checkout",
      "/orders",
      "/orders/{id}",
      "/rentals",
      "/profile"
    ],

    "sales": [
      "/sales/dashboard",
      "/sales/leads",
      "/sales/customers"
    ],

    "admin": [
      "/admin/dashboard",
      "/admin/users",
      "/admin/trucks",
      "/admin/rentals",
      "/admin/oranges",
      "/admin/orders",
      "/admin/deliveries",
      "/admin/leads",
      "/admin/reports"
    ]
  },

  "mobile_screens": {
    "authentication": [
      "LoginScreen",
      "RegisterScreen"
    ],
    "customer": [
      "HomeScreen",
      "TruckListScreen",
      "TruckDetailScreen",
      "RentalScreen",
      "OrangeListScreen",
      "OrangeDetailScreen",
      "CartScreen",
      "CheckoutScreen",
      "OrderHistoryScreen",
      "ProfileScreen"
    ]
  },

  "ui_ux": {
    "brand_direction": "modern professional truck showroom combined with agricultural marketplace",
    "visual_identity": {
      "primary": "dark green",
      "secondary": "orange",
      "neutral": "white, gray, charcoal",
      "truck_accent": "dark charcoal",
      "agro_accent": "orange"
    },
    "principles": [
      "mobile responsive",
      "fast navigation",
      "large product imagery",
      "clear prices",
      "clear call-to-action",
      "professional showroom appearance",
      "easy contact with sales",
      "minimal unnecessary decoration"
    ],
    "homepage_sections": [
      "hero",
      "featured trucks",
      "latest trucks",
      "truck categories",
      "rental trucks",
      "orange products",
      "why Dadi Mulyo",
      "customer reviews",
      "contact CTA"
    ]
  },

  "storage": {
    "type": "local",
    "driver": "public",
    "root": "storage/app/public",
    "directories": {
      "truck_images": "trucks",
      "orange_images": "oranges",
      "profiles": "profiles",
      "documents": "documents",
      "banners": "banners"
    },
    "command": "php artisan storage:link",
    "cloud_storage": false
  },

  "security": {
    "authentication": "Laravel Sanctum",
    "authorization": "role based authorization",
    "password": "Laravel Hash",
    "validation": "Form Request validation",
    "file_upload": [
      "validate MIME type",
      "validate file size",
      "generate safe filename",
      "never trust original filename"
    ],
    "api": [
      "validate request",
      "authorize user",
      "return consistent JSON",
      "do not expose passwords",
      "do not expose sensitive data"
    ]
  },

  "deployment": {
    "development": {
      "environment": "local computer",
      "server": "Laragon Apache",
      "database": "MySQL",
      "storage": "local"
    },

    "target": {
      "type": "shared hosting",
      "priority": "temporary deployment target"
    },

    "requirements": [
      "PHP version compatible with Laravel version",
      "MySQL",
      "Composer if supported",
      "Apache",
      "PHP extensions required by Laravel",
      "writable storage directory"
    ],

    "prohibited_dependencies": [
      "S3 requirement",
      "VPS requirement",
      "Docker requirement",
      "Kubernetes requirement",
      "cloud storage requirement"
    ]
  },

  "development_phases": {
    "phase_1": {
      "name": "Foundation",
      "tasks": [
        "create Laravel backend",
        "create MySQL database",
        "create React application",
        "configure Tailwind",
        "create Flutter application",
        "configure environment"
      ]
    },

    "phase_2": {
      "name": "Authentication",
      "tasks": [
        "register",
        "login",
        "logout",
        "roles",
        "profile"
      ]
    },

    "phase_3": {
      "name": "Truck Showroom",
      "tasks": [
        "truck categories",
        "truck CRUD",
        "multiple images",
        "specifications",
        "search",
        "filter",
        "detail page",
        "wishlist",
        "sales inquiry"
      ]
    },

    "phase_4": {
      "name": "Sales CRM",
      "tasks": [
        "leads",
        "sales assignment",
        "customer notes",
        "follow up",
        "lead status"
      ]
    },

    "phase_5": {
      "name": "Truck Rental",
      "tasks": [
        "rental listing",
        "availability",
        "booking",
        "pricing",
        "rental history"
      ]
    },

    "phase_6": {
      "name": "Orange Marketplace",
      "tasks": [
        "categories",
        "products",
        "grades",
        "stock",
        "pricing",
        "bulk order",
        "pre-order"
      ]
    },

    "phase_7": {
      "name": "Order and Delivery",
      "tasks": [
        "cart",
        "checkout",
        "order",
        "delivery",
        "truck assignment",
        "delivery status"
      ]
    },

    "phase_8": {
      "name": "Dashboard",
      "tasks": [
        "admin dashboard",
        "sales dashboard",
        "customer dashboard",
        "reports"
      ]
    },

    "phase_9": {
      "name": "Flutter",
      "tasks": [
        "authentication",
        "home",
        "truck browsing",
        "truck detail",
        "rental",
        "orange marketplace",
        "orders",
        "profile"
      ]
    },

    "phase_10": {
      "name": "Shared Hosting Deployment",
      "tasks": [
        "production environment configuration",
        "database migration",
        "React production build",
        "Laravel configuration",
        "storage configuration",
        "API configuration",
        "testing"
      ]
    }
  },

  "vibe_coding_rules": {
    "before_coding": [
      "read all relevant files in docs",
      "inspect current project structure",
      "inspect existing database schema",
      "inspect existing API",
      "inspect existing frontend"
    ],

    "while_coding": [
      "do not create duplicate files",
      "do not rewrite unrelated features",
      "do not change framework",
      "do not introduce unnecessary dependencies",
      "follow existing naming conventions",
      "use reusable components",
      "use reusable services",
      "validate all input",
      "handle API errors",
      "maintain responsive UI"
    ],

    "after_coding": [
      "list changed files",
      "explain what changed",
      "provide commands to run",
      "provide test instructions",
      "identify possible errors",
      "do not claim something is tested if it was not tested"
    ],

    "change_policy": {
      "breaking_changes": "require explicit approval",
      "database_changes": "must use migration",
      "api_changes": "must update API documentation",
      "ui_changes": "must preserve responsive behavior"
    }
  },

  "ai_behavior": {
    "role": "senior full-stack developer and technical architect",
    "communication": "clear and practical",
    "coding_style": "production oriented but simple enough for shared hosting",
    "when_error_occurs": [
      "identify root cause",
      "explain cause",
      "provide exact fix",
      "do not randomly change unrelated files"
    ],
    "when_requirement_is_ambiguous": [
      "state the ambiguity",
      "make the safest assumption",
      "do not invent business rules silently"
    ],
    "important_rule": "The AI must treat the docs directory as the source of truth for project requirements."
  },

  "mvp": {
    "must_have": [
      "authentication",
      "truck showroom",
      "truck CRUD",
      "truck image gallery",
      "truck detail",
      "search",
      "filter",
      "contact sales",
      "lead management",
      "truck rental",
      "orange marketplace",
      "basic order system",
      "admin dashboard"
    ],

    "not_required_initially": [
      "S3",
      "VPS",
      "real time chat",
      "live GPS tracking",
      "AI recommendation",
      "complex payment gateway",
      "microservices",
      "Kubernetes",
      "Docker infrastructure"
    ]
  },

  "success_criteria": [
    "customer can browse trucks",
    "customer can search and filter trucks",
    "customer can view truck details",
    "customer can contact sales",
    "admin can manage trucks",
    "sales can manage leads",
    "customer can book rental truck",
    "customer can browse orange products",
    "customer can create orange order",
    "admin can manage orders",
    "system can run locally",
    "system can be prepared for shared hosting",
    "web and mobile consume the same Laravel API"
  ]
}