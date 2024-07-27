import { FilmType } from "../types/FilmType";
import { ScheduleType } from "../types/ScheduleType";
import { TicketType } from "../types/TicketType";
import { conn } from "./index";
import { RowDataPacket } from "mysql2/promise";

export async function getAllFilms(): Promise<FilmType[] | undefined> {
  const sql = "SELECT * FROM films";

  try {
    const [results] = await conn.query<FilmType[] & RowDataPacket[]>(sql);

    if (results.length) {
      return results;
    }
  } catch (err) {
    throw err;
  }
}

export async function addFilm(film: FilmType): Promise<void> {
  const sql =
    "INSERT INTO films (title, release_year, duration, genre, description, cast, rating, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  try {
    await conn.execute(sql, [
      film.title,
      film.release_year,
      film.duration,
      film.genre,
      film.description,
      film.cast,
      film.rating,
      film.img,
    ]);
  } catch (err) {
    console.log(err); // TODO: handle error without app crash
  }
}

export async function getFilmById(id: number): Promise<FilmType | undefined> {
  const sql = "SELECT * FROM films WHERE id = ?";

  try {
    const [results] = await conn.query<FilmType[] & RowDataPacket[]>(sql, [id]);

    if (results.length) {
      return results[0];
    }
  } catch (err) {
    throw err;
  }
}

export async function deleteFilm(filmId: number): Promise<void> {
  const sql = "DELETE FROM films WHERE id = ?";

  try {
    await conn.execute(sql, [filmId]);
  } catch (err) {
    console.log(err); // TODO: handle error without app crash
    // throw err;
  }
}

export async function getSchedule(): Promise<ScheduleType[] | undefined> {
  const sql = "SELECT * FROM schedule";

  try {
    const [results] = await conn.query<ScheduleType[] & RowDataPacket[]>(sql);

    if (results.length) {
      return results;
    }
  } catch (err) {
    console.error("Error fetching schedule:", err);
    throw err;
  }
}

export async function addSchedule(schedule: ScheduleType): Promise<void> {
  const sql =
    "INSERT INTO schedule (film_id, schedule_datetime, capacity) VALUES (?, ?, ?)";

  try {
    await conn.execute(sql, [
      schedule.film_id,
      schedule.schedule_datetime,
      schedule.capacity,
    ]);
  } catch (err) {
    console.error("Error adding schedule:", err);
    throw err;
  }
}

export async function getTickets(
  username: string
): Promise<TicketType[] | undefined> {
  const sql =
    "SELECT * FROM tickets WHERE user_id = (SELECT id FROM users WHERE username = ?)";

  try {
    const [results] = await conn.query<TicketType[] & RowDataPacket[]>(sql, [
      username,
    ]);
    if (results.length) {
      return results;
    }
  } catch (err) {
    console.error("Error fetching tickets:", err);
    throw err;
  }
}

export async function addTicket(ticket: TicketType): Promise<void> {
  const insertTicketSql =
    "INSERT INTO tickets (user_id, film_id, schedule_id, seat_number, price) VALUES (?, ?, ?, ?, ?)";
  const updateCapacitySql =
    "UPDATE schedule SET capacity = capacity - 1 WHERE id = ? AND capacity > 0";

  const connection = await conn.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(insertTicketSql, [
      ticket.user_id,
      ticket.film_id,
      ticket.schedule_id,
      ticket.seat_number,
      ticket.price,
    ]);

    const [result] = await connection.execute(updateCapacitySql, [
      ticket.schedule_id,
    ]);

    if ((result as any).affectedRows === 0) {
      throw new Error("No seats available or invalid schedule ID");
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("Error adding ticket:", err);
    throw err;
  } finally {
    connection.release();
  }
}
