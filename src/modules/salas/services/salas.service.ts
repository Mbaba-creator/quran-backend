import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sala } from '../schemas/sala.schema';
import { Message } from '../schemas/message.schema';
import { Review } from '../schemas/review.schema';
import { Report } from '../schemas/report.schema';

@Injectable()
export class SalasService {
  constructor(
    @InjectModel(Sala.name) private salaModel: Model<Sala>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  async createSala(
    name: string,
    type: 'memorization_review' | 'recitation_correction',
    language: string,
    teacherId: string,
    gender: 'men' | 'women',
    parentId: string | null = null,
    surahName: string | null = null,
  ) {
    const sala = await this.salaModel.create({
      name,
      type,
      language,
      gender,
      surahName,
      teacherId: teacherId ? new Types.ObjectId(teacherId) : undefined,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      status: 'scheduled',
      isLive: false,
      members: new Map(),
    });
    return sala;
  }

  async getSalas(gender: 'men' | 'women', parentId: string | null = null, surahName: string | null = null) {
    const filter: any = { gender };
    filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
    if (surahName) filter.surahName = surahName;
    return await this.salaModel.find(filter);
  }

  async getSalaById(id: string) {
    return await this.salaModel.findById(id);
  }

  async startLiveClass(salaId: string, topic: string) {
    return await this.salaModel.findByIdAndUpdate(
      salaId,
      { isLive: true, status: 'active', topic },
      { new: true }
    );
  }

  async endLiveClass(salaId: string) {
    return await this.salaModel.findByIdAndUpdate(
      salaId,
      { isLive: false, status: 'inactive' },
      { new: true }
    );
  }

  async joinClass(salaId: string, userId: string, displayName: string, role: 'teacher' | 'student') {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');

    sala.members.set(userId, JSON.stringify({ displayName, role }));
    await sala.save();
    return sala;
  }

  async leaveClass(salaId: string, userId: string) {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');

    sala.members.delete(userId);
    await sala.save();
    return sala;
  }

  async addMessage(salaId: string, userId: string, displayName: string, content: string) {
    const message = await this.messageModel.create({
      salaId: new Types.ObjectId(salaId),
      userId,
      displayName,
      content,
    });
    return message;
  }

  async getMessages(salaId: string) {
    return await this.messageModel.find({ salaId: new Types.ObjectId(salaId) });
  }

  async submitReview(
    salaId: string,
    studentId: string,
    studentName: string,
    teacherId: string,
    teacherName: string,
    surahName: string,
    result: 'approved' | 'needs_practice',
  ) {
    const review = await this.reviewModel.create({
      salaId: new Types.ObjectId(salaId),
      studentId,
      studentName,
      teacherId: teacherId ? new Types.ObjectId(teacherId) : undefined,
      teacherName,
      surahName,
      result,
    });
    return review;
  }

  async getReviewsByStudent(studentId: string) {
    return await this.reviewModel.find({ studentId }).sort({ createdAt: -1 });
  }

  async submitReport(
    reporterId: string,
    reporterName: string,
    reportedUserId: string,
    reportedUserName: string,
    salaId: string | null,
    reason: string,
  ) {
    const report = await this.reportModel.create({
      reporterId,
      reporterName,
      reportedUserId,
      reportedUserName,
      salaId: salaId ? new Types.ObjectId(salaId) : undefined,
      reason,
    });
    return report;
  }
}
