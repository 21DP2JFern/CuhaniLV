from sqlalchemy.orm import relationship

class User:
    news_articles = relationship("News", back_populates="author") 