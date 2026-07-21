import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { SalasService } from '../services/salas.service';
import { User } from '../../auth/schemas/user.schema';

@WebSocketGateway({
  namespace: '/salas',
  cors: { origin: '*' },
})
export class SalasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private salasService: SalasService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth && client.handshake.auth.token) ||
        (client.handshake.headers.authorization || '').replace('Bearer ', '');

      if (!token) {
        client.emit('auth-error', { message: 'No token provided' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'dev-secret',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || user.deleted_at) {
        client.emit('auth-error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      if (user.isBanned) {
        client.emit('banned', { reason: user.banReason || 'Your account has been suspended' });
        client.disconnect();
        return;
      }

      client.data.user = {
        userId: (user._id as any).toString(),
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        isAdmin: user.isAdmin || false,
      };

      this.userSockets.set(client.data.user.userId, client.id);

      console.log('Authenticated connection:', client.data.user.displayName, client.data.user.role, client.data.user.gender);
    } catch (err) {
      client.emit('auth-error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      const uid = client.data.user.userId;
      if (this.userSockets.get(uid) === client.id) {
        this.userSockets.delete(uid);
      }
      console.log('User disconnected:', client.data.user.displayName);
    }
  }

  @SubscribeMessage('get-salas')
  async handleGetSalas(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { parentId?: string | null; surahName?: string | null },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    return await this.salasService.getSalas(user.gender, data.parentId || null, data.surahName || null);
  }

  @SubscribeMessage('create-sala')
  async handleCreateSala(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      name: string;
      type: 'memorization_review' | 'recitation_correction';
      language: string;
      parentId?: string | null;
      surahName?: string | null;
      scheduledDays?: number[];
      scheduledTime?: string | null;
      scheduledTimezone?: string | null;
    },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    if (user.role !== 'teacher') {
      client.emit('app-error', { message: 'Only teachers can create rooms' });
      return { error: 'Forbidden' };
    }

    const sala = await this.salasService.createSala(
      data.name,
      data.type,
      data.language,
      user.userId,
      user.gender,
      data.parentId || null,
      data.surahName || null,
      data.scheduledDays || [],
      data.scheduledTime || null,
      data.scheduledTimezone || null,
    );
    this.server.emit('sala-created', sala);
    return sala;
  }

  @SubscribeMessage('start-live-class')
  async handleStartLiveClass(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salaId: string; topic: string },
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'teacher') {
      client.emit('app-error', { message: 'Only teachers can start a live class' });
      return;
    }
    const sala = await this.salasService.startLiveClass(data.salaId, data.topic);
    this.server.to(data.salaId).emit('class-started', sala);
    return sala;
  }

  @SubscribeMessage('end-live-class')
  async handleEndLiveClass(@ConnectedSocket() client: Socket, @MessageBody() data: { salaId: string }) {
    const user = client.data.user;
    if (!user || user.role !== 'teacher') {
      client.emit('app-error', { message: 'Only teachers can end a live class' });
      return;
    }
    const sala = await this.salasService.endLiveClass(data.salaId);
    this.server.to(data.salaId).emit('class-ended', sala);
    return sala;
  }

  @SubscribeMessage('join-class')
  async handleJoinClass(
    @MessageBody() data: { salaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };

    const targetSala = await this.salasService.getSalaById(data.salaId);
    if (!targetSala) return { error: 'Sala not found' };
    if (targetSala.gender !== user.gender) {
      client.emit('app-error', { message: 'You cannot join a room from the other section' });
      return { error: 'Forbidden' };
    }

    const sala = await this.salasService.joinClass(data.salaId, user.userId, user.displayName, user.role as any);
    client.join(data.salaId);
    this.server.to(data.salaId).emit('user-joined', {
      userId: user.userId,
      displayName: user.displayName,
      role: user.role,
      members: sala.members.size,
    });
    return sala;
  }

  @SubscribeMessage('leave-class')
  async handleLeaveClass(@ConnectedSocket() client: Socket, @MessageBody() data: { salaId: string }) {
    const user = client.data.user;
    if (!user) return;
    const sala = await this.salasService.leaveClass(data.salaId, user.userId);
    client.to(data.salaId).emit('peer-left-audio', { userId: user.userId });
    client.leave(data.salaId);
    this.server.to(data.salaId).emit('user-left', {
      userId: user.userId,
      members: sala.members.size,
    });
    return sala;
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salaId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;
    const message = await this.salasService.addMessage(data.salaId, user.userId, user.displayName, data.content);
    this.server.to(data.salaId).emit('new-message', message);
    return message;
  }

  @SubscribeMessage('get-messages')
  async handleGetMessages(@MessageBody() data: { salaId: string }) {
    return await this.salasService.getMessages(data.salaId);
  }

  @SubscribeMessage('submit-review')
  async handleSubmitReview(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      salaId: string;
      studentId: string;
      studentName: string;
      surahName: string;
      result: 'approved' | 'needs_practice';
    },
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'teacher') {
      client.emit('app-error', { message: 'Only teachers can submit reviews' });
      return;
    }
    const review = await this.salasService.submitReview(
      data.salaId,
      data.studentId,
      data.studentName,
      user.userId,
      user.displayName,
      data.surahName,
      data.result,
    );
    this.server.to(data.salaId).emit('review-received', review);
    return review;
  }

  @SubscribeMessage('get-my-reviews')
  async handleGetMyReviews(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) return [];
    return await this.salasService.getReviewsByStudent(user.userId);
  }

  @SubscribeMessage('report-user')
  async handleReportUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { reportedUserId: string; reportedUserName: string; salaId: string | null; reason: string },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    const report = await this.salasService.submitReport(
      user.userId,
      user.displayName,
      data.reportedUserId,
      data.reportedUserName,
      data.salaId,
      data.reason,
    );
    return { success: true, reportId: report._id };
  }

  @SubscribeMessage('get-teacher-profile')
  async handleGetTeacherProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { teacherId: string },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    if (!data.teacherId) return { error: 'No teacher specified' };

    const teacher = await this.userModel.findById(data.teacherId);
    if (!teacher) return { error: 'Teacher not found' };

    return {
      displayName: teacher.display_name,
      hasTaughtBefore: teacher.hasTaughtBefore,
      isHafiz: teacher.isHafiz,
      teacherExperience: teacher.teacherExperience,
    };
  }

  // ===== Admin panel =====

  @SubscribeMessage('admin-get-reports')
  async handleAdminGetReports(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user || !user.isAdmin) {
      client.emit('app-error', { message: 'Admin access required' });
      return { error: 'Forbidden' };
    }
    return await this.salasService.getAllReports();
  }

  @SubscribeMessage('admin-resolve-report')
  async handleAdminResolveReport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { reportId: string },
  ) {
    const user = client.data.user;
    if (!user || !user.isAdmin) {
      client.emit('app-error', { message: 'Admin access required' });
      return { error: 'Forbidden' };
    }
    return await this.salasService.resolveReport(data.reportId);
  }

  @SubscribeMessage('admin-get-users')
  async handleAdminGetUsers(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user || !user.isAdmin) {
      client.emit('app-error', { message: 'Admin access required' });
      return { error: 'Forbidden' };
    }
    const users = await this.userModel.find().select('-password_hash').sort({ created_at: -1 });
    return users;
  }

  @SubscribeMessage('admin-set-ban')
  async handleAdminSetBan(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; isBanned: boolean; banReason?: string },
  ) {
    const user = client.data.user;
    if (!user || !user.isAdmin) {
      client.emit('app-error', { message: 'Admin access required' });
      return { error: 'Forbidden' };
    }
    const target = await this.userModel.findByIdAndUpdate(
      data.userId,
      { isBanned: data.isBanned, banReason: data.isBanned ? (data.banReason || 'Violation of community guidelines') : null },
      { new: true },
    );
    return { success: true, userId: data.userId, isBanned: target ? target.isBanned : data.isBanned };
  }

  @SubscribeMessage('admin-set-role')
  async handleAdminSetRole(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; role: 'student' | 'teacher' },
  ) {
    const user = client.data.user;
    if (!user || !user.isAdmin) {
      client.emit('app-error', { message: 'Admin access required' });
      return { error: 'Forbidden' };
    }
    const target = await this.userModel.findByIdAndUpdate(data.userId, { role: data.role }, { new: true });
    return { success: true, userId: data.userId, role: target ? target.role : data.role };
  }

  // ===== WebRTC signaling relay (mesh, small groups) =====

  @SubscribeMessage('join-audio')
  handleJoinAudio(@ConnectedSocket() client: Socket, @MessageBody() data: { salaId: string }) {
    const user = client.data.user;
    if (!user) return;
    client.to(data.salaId).emit('peer-joined-audio', {
      userId: user.userId,
      displayName: user.displayName,
      role: user.role,
    });
  }

  @SubscribeMessage('leave-audio')
  handleLeaveAudio(@ConnectedSocket() client: Socket, @MessageBody() data: { salaId: string }) {
    const user = client.data.user;
    if (!user) return;
    client.to(data.salaId).emit('peer-left-audio', { userId: user.userId });
  }

  @SubscribeMessage('webrtc-offer')
  handleWebrtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; offer: any },
  ) {
    const user = client.data.user;
    if (!user) return;
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('webrtc-offer', {
        fromUserId: user.userId,
        fromDisplayName: user.displayName,
        offer: data.offer,
      });
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleWebrtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; answer: any },
  ) {
    const user = client.data.user;
    if (!user) return;
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('webrtc-answer', {
        fromUserId: user.userId,
        answer: data.answer,
      });
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; candidate: any },
  ) {
    const user = client.data.user;
    if (!user) return;
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
        fromUserId: user.userId,
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('force-mute')
  handleForceMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salaId: string; targetUserId: string; muted: boolean },
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'teacher') {
      client.emit('app-error', { message: 'Only teachers can mute participants' });
      return;
    }
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('force-mute-state', { muted: data.muted });
    }
    this.server.to(data.salaId).emit('participant-mute-changed', { userId: data.targetUserId, muted: data.muted });
  }
}

