from .routers import news

# Add this line with the other router includes
app.include_router(news.router) 