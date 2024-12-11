// src/app/api/reservations/route.js
import { NextResponse } from 'next/server';
import dbConnect from "../../../utils/db";
import { Reservation } from "../../../models/Reservation.js";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    // Find reservations where the team is in any preference
    const reservations = await Reservation.find({
      $or: [
        { 'teamId': teamId },
      ]
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// For cancelling a reservation
export async function DELETE(request) {
  try {
    await dbConnect();
    const { reservationId } = await request.json();

    await Reservation.findByIdAndDelete(reservationId);

    return NextResponse.json({ 
      message: 'Reservation completely cancelled' 
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}