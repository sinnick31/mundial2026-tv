import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

export const ChannelBanner: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#07111f' }}>
    <Img src={staticFile('channel-assets/youtube-banner.svg')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  </AbsoluteFill>
);

export const ChannelAvatar: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#07111f' }}>
    <Img src={staticFile('channel-assets/profile-chilensis.svg')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  </AbsoluteFill>
);
