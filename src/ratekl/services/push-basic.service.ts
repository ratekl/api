import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { AppData } from "../../models/app-data.model";
import { AppMember } from "../../models/app-member.model";
import { sendPushNotification } from "./firebaseNotify";
import { AppDataRepository } from "../../repositories/app-data.repository";
import { ActivityService } from "./activity.service";
import { securityId } from '@loopback/security';

const state = {

};

export const pushBasicPost = async (post: AppData, postUser: AppMember, title: string, users: AppMember[], appDataRepository: AppDataRepository, activityService: ActivityService, hostName: string) => {
  for (const user of users) {
    if (user.memberData?.pushToken) {

      pushBasicMessage(
        hostName,
        user,
        appDataRepository,
        activityService,
        '' + user.memberData.pushToken,
        user.memberData.pushType === 'ios' ? 'ios' : 'android',
        title,
        `New message from ${postUser.preferredName ?? (postUser.firstName + ' ' + postUser.lastName)}`,
        {
          postId: post.name
        }
      );
    }
  }
}

export const pushBasicComment = async (comment: AppData, postUser: AppMember, title: string, users: AppMember[], appDataRepository: AppDataRepository, activityService: ActivityService, hostName: string) => {
  for (const user of users) {
    if (user.memberData?.pushToken) {

      pushBasicMessage(
        hostName,
        user,
        appDataRepository,
        activityService,
        '' + user.memberData.pushToken,
        user.memberData.pushType === 'ios' ? 'ios' : 'android',
        title,
        `New comment from ${postUser.preferredName ?? (postUser.firstName + ' ' + postUser.lastName)}`,
        {
          commentId: comment.name
        },
        (comment.data as any)?.itemName
      );
    }
  }
}

export const pushBasicReferral = async (referral: AppData, postUser: AppMember, title: string, user: AppMember, appDataRepository: AppDataRepository, activityService: ActivityService, hostName: string) => {
  if (user.memberData?.pushToken) {
    const r: any = referral?.data;

    pushBasicMessage(
      hostName,
      user,
      appDataRepository,
      activityService,
      '' + user.memberData.pushToken,
      user.memberData.pushType === 'ios' ? 'ios' : 'android',
      title,
      `You have a new referral from ${postUser.preferredName ?? (postUser.firstName + ' ' + postUser.lastName)}`,
      {
        commentId: referral?.name
      },
      (r?.preferredName ? r?.preferredName : (r?.firstName ? `${r?.firstName} ${r?.lastName}` : r?.message))
    );
  }
}

const pushBasicMessage = async (hostName: string, user: AppMember, appDataRepository: AppDataRepository, activityService: ActivityService, token: string, pushType: 'ios' | 'android', messageTitle:string, messageBody: string, data: {[key: string]: string}, threadId?: string) => {
  const message: Message = {
    token,
    data,
    notification: {
      title: messageTitle,
      body: messageBody
    },
  };

  const lastSeen = await activityService.getActivityByUser(hostName, {
    [securityId]: user.userName,
    email: user.email,
    name: `${user.preferredName ?? (user.firstName + ' ' + user.lastName)}`
  }, 'post');

  let posts: AppData[] = [];
 
  if (lastSeen) {
    posts = await appDataRepository.find({
      where: { createdAt: {gt: new Date(lastSeen)}, type: {inq: ['post', 'comment']}}
    });
  }

  try {
    // update the activity so that we don't keep increasing message counts in notifications
    const lastMessage = posts.reduce((prev, curr) => {
      if (curr.createdAt > prev.createdAt) {
        return curr
      }

      return prev;
    });

    if (lastMessage?.createdAt) {
      await activityService.setActivity(hostName, {
        [securityId]: user.userName,
        email: user.email,
        name: `${user.preferredName ?? (user.firstName + ' ' + user.lastName)}`
      }, 'post', lastMessage.createdAt.toISOString());
    }
  } catch (e) {
    console.log('error updating activity');
  }

  const countPosts = posts.length;

  if (pushType === 'ios') {
    message.apns = {
      payload: {
        aps: {
          badge: countPosts,
        }
      }
    };

    if (threadId && message.apns.payload?.aps) {
      message.apns.payload.aps.threadId = threadId;
    }
  } else {
    message.android = {
      notification: {
        notificationCount: countPosts
      }
    };

    if (threadId && message.android) {
      message.android.data = { ...message.android.data, threadId };
    }
  }

  sendPushNotification(message, pushType);
};