// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { JsonOf } from '@evaka/lib-common/src/json'
import { Failure, Result, Success } from '~api'
import { UUID } from '~types'
import { AbsenceType, CareType } from '~types/absence'
import { PlacementType } from '~types/placementdraft'
import { client } from './client'

export interface AttendanceResponse {
  unit: Unit
  children: AttendanceChild[]
}

export interface Unit {
  id: UUID
  name: string
  groups: Group[]
}

export interface Group {
  id: UUID
  name: string
}

export interface AttendanceChild {
  id: UUID
  firstName: string
  lastName: string
  groupId: UUID
  status: AttendanceStatus
  placementType: PlacementType
  attendance: Attendance | null
  absences: Absence[]
}

interface Attendance {
  id: UUID
  arrived: Date
  departed: Date | null
}

interface Absence {
  absenceType: AbsenceType
  careType: CareType
  childId: UUID
  id: UUID
}

interface ArrivalInfoResponse {
  absentFromPreschool: boolean
}

export type AttendanceStatus = 'COMING' | 'PRESENT' | 'DEPARTED' | 'ABSENT'

export async function getDaycareAttendances(
  unitId: UUID
): Promise<Result<AttendanceResponse>> {
  return client
    .get<JsonOf<AttendanceResponse>>(`/attendances/units/${unitId}`)
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

export async function childArrivesPOST(
  unitId: UUID,
  childId: UUID,
  time: string
): Promise<Result<AttendanceResponse>> {
  return client
    .post<JsonOf<AttendanceResponse>>(
      `/attendances/units/${unitId}/children/${childId}/arrival`,
      {
        arrived: time
      }
    )
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

export async function childArrivesGET(
  unitId: UUID,
  childId: UUID,
  time: string
): Promise<Result<ArrivalInfoResponse>> {
  return client
    .get<JsonOf<ArrivalInfoResponse>>(
      `/attendances/units/${unitId}/children/${childId}/arrival`,
      {
        params: { time }
      }
    )
    .then((res) => res.data)
    .then(Success)
    .catch(Failure)
}

// TODO: update context with the response!
export async function childDeparts(
  unitId: UUID,
  childId: UUID,
  time: string
): Promise<Result<AttendanceResponse>> {
  return client
    .post<JsonOf<AttendanceResponse>>(
      `/attendances/units/${unitId}/children/${childId}/departure`,
      {
        departed: time
      }
    )
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

export async function returnToComing(
  unitId: UUID,
  childId: UUID
): Promise<Result<AttendanceResponse>> {
  return client
    .post<JsonOf<AttendanceResponse>>(
      `/attendances/units/${unitId}/children/${childId}/return-to-coming`
    )
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

export async function returnToPresent(
  unitId: UUID,
  childId: UUID
): Promise<Result<AttendanceResponse>> {
  return client
    .post<JsonOf<AttendanceResponse>>(
      `/attendances/units/${unitId}/children/${childId}/return-to-present`
    )
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

export async function postFullDayAbsence(
  unitId: UUID,
  childId: UUID,
  absenceType: AbsenceType
): Promise<Result<AttendanceResponse>> {
  return client
    .post<JsonOf<AttendanceResponse>>(
      `/attendances/units/${unitId}/children/${childId}/full-day-absence`,
      {
        absenceType
      }
    )
    .then((res) => deserializeAttendanceResponse(res.data))
    .then(Success)
    .catch(Failure)
}

function deserializeAttendanceResponse(
  data: JsonOf<AttendanceResponse>
): AttendanceResponse {
  {
    return {
      unit: data.unit,
      children: data.children.map((attendanceChild) => {
        return {
          ...attendanceChild,
          attendance: attendanceChild.attendance
            ? {
                ...attendanceChild.attendance,
                arrived: new Date(attendanceChild.attendance.arrived),
                departed: attendanceChild.attendance.departed
                  ? new Date(attendanceChild.attendance.departed)
                  : null
              }
            : null
        }
      })
    }
  }
}