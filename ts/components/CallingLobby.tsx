// Copyright 2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { ReactNode } from 'react';
import {
  SetLocalAudioType,
  SetLocalPreviewType,
  SetLocalVideoType,
} from '../state/ducks/calling';
import { CallingButton, CallingButtonType } from './CallingButton';
import { TooltipPlacement } from './Tooltip';
import { CallBackgroundBlur } from './CallBackgroundBlur';
import { CallingHeader } from './CallingHeader';
import { Spinner } from './Spinner';
import { ColorType } from '../types/Colors';
import { LocalizerType } from '../types/Util';
import { ConversationType } from '../state/ducks/conversations';

export type PropsType = {
  availableCameras: Array<MediaDeviceInfo>;
  conversation: {
    title: string;
  };
  hasLocalAudio: boolean;
  hasLocalVideo: boolean;
  i18n: LocalizerType;
  isGroupCall: boolean;
  isCallFull?: boolean;
  me: {
    avatarPath?: string;
    color?: ColorType;
    uuid: string;
  };
  onCallCanceled: () => void;
  onJoinCall: () => void;
  peekedParticipants: Array<ConversationType>;
  setLocalAudio: (_: SetLocalAudioType) => void;
  setLocalVideo: (_: SetLocalVideoType) => void;
  setLocalPreview: (_: SetLocalPreviewType) => void;
  showParticipantsList: boolean;
  toggleParticipants: () => void;
  toggleSettings: () => void;
};

export const CallingLobby = ({
  availableCameras,
  conversation,
  hasLocalAudio,
  hasLocalVideo,
  i18n,
  isGroupCall = false,
  isCallFull = false,
  me,
  onCallCanceled,
  onJoinCall,
  peekedParticipants,
  setLocalAudio,
  setLocalPreview,
  setLocalVideo,
  showParticipantsList,
  toggleParticipants,
  toggleSettings,
}: PropsType): JSX.Element => {
  const localVideoRef = React.useRef(null);

  const toggleAudio = React.useCallback((): void => {
    setLocalAudio({ enabled: !hasLocalAudio });
  }, [hasLocalAudio, setLocalAudio]);

  const toggleVideo = React.useCallback((): void => {
    setLocalVideo({ enabled: !hasLocalVideo });
  }, [hasLocalVideo, setLocalVideo]);

  React.useEffect(() => {
    setLocalPreview({ element: localVideoRef });

    return () => {
      setLocalPreview({ element: undefined });
    };
  }, [setLocalPreview]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      let eventHandled = false;

      if (event.shiftKey && (event.key === 'V' || event.key === 'v')) {
        toggleVideo();
        eventHandled = true;
      } else if (event.shiftKey && (event.key === 'M' || event.key === 'm')) {
        toggleAudio();
        eventHandled = true;
      }

      if (eventHandled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleVideo, toggleAudio]);

  const [isCallConnecting, setIsCallConnecting] = React.useState(false);

  // eslint-disable-next-line no-nested-ternary
  const videoButtonType = hasLocalVideo
    ? CallingButtonType.VIDEO_ON
    : availableCameras.length === 0
    ? CallingButtonType.VIDEO_DISABLED
    : CallingButtonType.VIDEO_OFF;
  const audioButtonType = hasLocalAudio
    ? CallingButtonType.AUDIO_ON
    : CallingButtonType.AUDIO_OFF;

  // It should be rare to see yourself in this list, but it's possible if (1) you rejoin
  //   quickly, causing the server to return stale state (2) you have joined on another
  //   device.
  const participantNames = peekedParticipants.map(participant =>
    participant.uuid === me.uuid
      ? i18n('you')
      : participant.firstName || participant.title
  );
  const hasYou = peekedParticipants.some(
    participant => participant.uuid === me.uuid
  );

  const canJoin = !isCallFull && !isCallConnecting;

  let joinButtonChildren: ReactNode;
  if (isCallFull) {
    joinButtonChildren = i18n('calling__call-is-full');
  } else if (isCallConnecting) {
    joinButtonChildren = <Spinner svgSize="small" />;
  } else if (peekedParticipants.length) {
    joinButtonChildren = i18n('calling__join');
  } else {
    joinButtonChildren = i18n('calling__start');
  }

  return (
    <div className="module-calling__container">
      <CallingHeader
        title={conversation.title}
        i18n={i18n}
        isGroupCall={isGroupCall}
        participantCount={peekedParticipants.length}
        showParticipantsList={showParticipantsList}
        toggleParticipants={toggleParticipants}
        toggleSettings={toggleSettings}
      />

      <div className="module-calling-lobby__video">
        {hasLocalVideo && availableCameras.length > 0 ? (
          <video
            className="module-calling-lobby__video-on__video"
            ref={localVideoRef}
            autoPlay
          />
        ) : (
          <CallBackgroundBlur avatarPath={me.avatarPath} color={me.color}>
            <div className="module-calling__video-off--icon" />
            <span className="module-calling__video-off--text">
              {i18n('calling__your-video-is-off')}
            </span>
          </CallBackgroundBlur>
        )}

        <div className="module-calling__buttons">
          <CallingButton
            buttonType={videoButtonType}
            i18n={i18n}
            onClick={toggleVideo}
            tooltipDirection={TooltipPlacement.Top}
          />
          <CallingButton
            buttonType={audioButtonType}
            i18n={i18n}
            onClick={toggleAudio}
            tooltipDirection={TooltipPlacement.Top}
          />
        </div>
      </div>

      {isGroupCall ? (
        <div className="module-calling-lobby__info">
          {participantNames.length === 0 &&
            i18n('calling__lobby-summary--zero')}
          {participantNames.length === 1 &&
            hasYou &&
            i18n('calling__lobby-summary--self')}
          {participantNames.length === 1 &&
            !hasYou &&
            i18n('calling__lobby-summary--single', participantNames)}
          {participantNames.length === 2 &&
            i18n('calling__lobby-summary--double', {
              first: participantNames[0],
              second: participantNames[1],
            })}
          {participantNames.length === 3 &&
            i18n('calling__lobby-summary--triple', {
              first: participantNames[0],
              second: participantNames[1],
              third: participantNames[2],
            })}
          {participantNames.length > 3 &&
            i18n('calling__lobby-summary--many', {
              first: participantNames[0],
              second: participantNames[1],
              others: String(participantNames.length - 2),
            })}
        </div>
      ) : null}

      <div className="module-calling-lobby__actions">
        <button
          className="module-button__gray module-calling-lobby__button"
          onClick={onCallCanceled}
          tabIndex={0}
          type="button"
        >
          {i18n('cancel')}
        </button>
        <button
          className="module-button__green module-calling-lobby__button"
          disabled={!canJoin}
          onClick={
            canJoin
              ? () => {
                  setIsCallConnecting(true);
                  onJoinCall();
                }
              : undefined
          }
          tabIndex={0}
          type="button"
        >
          {joinButtonChildren}
        </button>
      </div>
    </div>
  );
};
