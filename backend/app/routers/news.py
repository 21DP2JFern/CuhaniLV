from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.news import News
from ..models.user import User
from ..database import get_db
from ..auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/news",
    tags=["news"]
)

class NewsCreate(BaseModel):
    title: str
    content: str
    category: str
    image_url: str | None = None

class NewsResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    image_url: str | None
    created_at: str
    author: dict

@router.get("/", response_model=List[NewsResponse])
def get_news(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all news articles"""
    news = db.query(News).order_by(News.created_at.desc()).all()
    return [article.to_dict() for article in news]

@router.post("/", response_model=NewsResponse)
def create_news(
    news: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new news article (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create news articles"
        )

    db_news = News(
        title=news.title,
        content=news.content,
        category=news.category,
        image_url=news.image_url,
        author_id=current_user.id
    )
    
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news.to_dict()

@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a news article (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete news articles"
        )

    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found"
        )

    db.delete(news)
    db.commit()
    return {"message": "News article deleted successfully"} 