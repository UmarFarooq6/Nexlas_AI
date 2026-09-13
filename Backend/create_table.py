from database import Base, engine
from models.user import User
from models.career import Career
from models.course import Course
from models.mentor import Mentor
from models.learner_profile import LearnerProfile
from models.chat_message import ChatMessage
from models.roadmap import Roadmap
from models.project import Project
from models.mentor_session import MentorSession

Base.metadata.create_all(bind=engine)
print("All tables created successfully.")