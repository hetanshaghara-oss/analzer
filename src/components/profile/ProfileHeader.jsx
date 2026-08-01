import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Mail, Calendar, Users, UserPlus, BookOpen, Palette, Briefcase } from 'lucide-react';
import { GithubIcon, TwitterIcon } from '../ui/icons';
import Card from '../ui/Card';
import './ProfileHeader.css';

const ProfileHeader = ({ user }) => {
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card className="profile-header">
      {/* Decorative banner */}
      <div className="profile-banner">
        <span className="profile-banner-glow profile-banner-glow--1" />
        <span className="profile-banner-glow profile-banner-glow--2" />
        <div className="profile-banner-grid" />
      </div>

      {/* Avatar — hangs over the banner/body boundary (sibling of the
          banner so it isn't clipped by the banner's overflow) */}
      <div className="profile-avatar-wrap">
        <img src={user.avatar_url} alt={`${user.login}'s avatar`} className="profile-avatar" />
      </div>

      <div className="profile-body">
        <div className="profile-main">
          <div className="profile-title-row">
            <h1 className="profile-name">{user.name || user.login}</h1>
            <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="profile-username">
              @{user.login}
            </a>
          </div>

          {user.bio && <p className="profile-bio">{user.bio}</p>}

          <div className="profile-details">
            {user.company && (
              <span className="profile-detail">
                <Briefcase size={13} /> <span>{user.company}</span>
              </span>
            )}
            {user.location && (
              <span className="profile-detail">
                <MapPin size={13} /> <span>{user.location}</span>
              </span>
            )}
            {user.blog && (
              <span className="profile-detail">
                <LinkIcon size={13} />
                <a
                  href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-detail-link"
                >
                  {user.blog.replace(/^https?:\/\//, '')}
                </a>
              </span>
            )}
            {user.twitter_username && (
              <span className="profile-detail">
                <TwitterIcon size={13} />
                <a
                  href={`https://twitter.com/${user.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-detail-link"
                >
                  @{user.twitter_username}
                </a>
              </span>
            )}
            {user.email && (
              <span className="profile-detail">
                <Mail size={13} /> <span>{user.email}</span>
              </span>
            )}
            <span className="profile-detail">
              <Calendar size={13} /> <span>Joined {joinDate}</span>
            </span>
          </div>
        </div>

        <div className="profile-side">
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-icon profile-stat-icon--yellow"><Users size={15} /></span>
              <div className="profile-stat-text">
                <b>{user.followers.toLocaleString()}</b>
                <span>Followers</span>
              </div>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-icon profile-stat-icon--blue"><UserPlus size={15} /></span>
              <div className="profile-stat-text">
                <b>{user.following.toLocaleString()}</b>
                <span>Following</span>
              </div>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-icon profile-stat-icon--green"><BookOpen size={15} /></span>
              <div className="profile-stat-text">
                <b>{user.public_repos.toLocaleString()}</b>
                <span>Public repos</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-action profile-action--ghost"
            >
              <GithubIcon size={15} /> View on GitHub
            </a>
            <Link to={`/builder/${user.login}`} className="profile-action profile-action--primary">
              <Palette size={15} /> Studio Builder
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileHeader;
