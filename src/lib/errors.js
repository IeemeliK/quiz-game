export class AppError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

export class ValidationError extends AppError {
	constructor(m = "Invalid input") {
		super(m, 400);
	}
}

export class UnauthorizedError extends AppError {
	constructor(m = "Unauthorized") {
		super(m, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(m = "Forbidden") {
		super(m, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(m = "Not found") {
		super(m, 404);
	}
}

export class ConflictError extends AppError {
	constructor(m = "Conflict") {
		super(m, 409);
	}
}
