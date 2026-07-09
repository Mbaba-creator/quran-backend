export class SalaDto {
  id: string;
  name: string;
  type: string;
  language: string;
  createdAt: Date;
  members: string[];
}

export class MessageDto {
  id: string;
  salaId: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: Date;
}

export class CreateSalaDto {
  name: string;
  type: string;
  language: string;
}

export class JoinSalaDto {
  userId: string;
  displayName: string;
}
