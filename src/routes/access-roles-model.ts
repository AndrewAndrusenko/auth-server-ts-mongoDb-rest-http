import { TAcRole } from "../types/shared-models";

export interface IAccessRole {
  route:string,
  roles:TAcRole[]
}
export const ACCESS_ROUTES_ROLES:IAccessRole[] = [
  { route:'/quote',  roles:['user','admin'] },
  { route:'/admin',  roles:['admin'] },
]