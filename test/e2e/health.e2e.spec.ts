import { get, LAMBDAS_URL, REALM_URL } from './realm'

type Status = { version: string; commitHash: string; currentTime: number }
type About = {
  healthy: boolean
  acceptingUsers: boolean
  lambdas: { healthy: boolean; commitHash: string; version: string }
}

describe('when asking the realm about itself', () => {
  let status: Awaited<ReturnType<typeof get<Status>>>
  let about: Awaited<ReturnType<typeof get<About>>>

  beforeEach(async () => {
    status = await get<Status>(`${LAMBDAS_URL}/status`)
    about = await get<About>(`${REALM_URL}/about`)
  })

  it('should report the lambdas build it is running', () => {
    expect(status.body).toMatchObject({
      commitHash: expect.stringMatching(/^[0-9a-f]{40}$/),
      version: expect.any(String)
    })
  })

  it('should be healthy and accepting users', () => {
    expect([about.body.healthy, about.body.acceptingUsers]).toEqual([true, true])
  })

  it('should advertise the same lambdas build from the realm and from the service', () => {
    expect(about.body.lambdas.commitHash).toBe(status.body.commitHash)
  })
})
