import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { VoucherApi } from "../../services/api/voucher-api"
import { trainRouteSchema } from "../train-routes/train-routes"
import { withEnvironment, withStatus } from ".."

/**
 * Model description here for TypeScript hints.
 */
export const voucherDetailsModel = types
  .model("VoucherDetails")
  .props({
    route: types.model(trainRouteSchema),
    userId: types.maybe(types.string),
    phoneNumber: types.maybe(types.string),
  })
  .views((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .extend(withEnvironment)
  .extend(withStatus)
  .actions((self) => ({
    setRoute(route) {
      self.route = route
    },
    setUserId(userId: string) {
      self.userId = userId
    },
    setPhoneNumber(phoneNumber: string) {
      self.phoneNumber = phoneNumber
    },
  }))
  .actions((self) => ({
    requestToken: async (userId: string, phoneNumber: string) => {
      const voucherApi = new VoucherApi(self.environment.api)
      return voucherApi.requestToken(userId, phoneNumber)
    },

    requestBarcode: async (token: string) => {
      const { userId, phoneNumber, route } = self

      // const voucherApi = new VoucherApi(self.environment.api)
      // return voucherApi.requestBarcode({ userId, phoneNumber, token, route })
    },
  }))

/**
 * Un-comment the following to omit model attributes from your snapshots (and from async storage).
 * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

 * Note that you'll need to import `omit` from ramda, which is already included in the project!
 *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
 */

type VoucherDetailsType = Instance<typeof voucherDetailsModel>
export interface VoucherDetails extends VoucherDetailsType {}
type VoucherDetailsSnapshotType = SnapshotOut<typeof voucherDetailsModel>
export interface VoucherDetailsSnapshot extends VoucherDetailsSnapshotType {}
export const createVoucherDetailsDefaultModel = () => types.optional(voucherDetailsModel, {})
