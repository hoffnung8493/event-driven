import { Schema, Document, model } from 'mongoose'

export interface ConfigDoc extends Document {
  modules: string[]
}

const ConfigSchema = new Schema(
  {
    modules: [{ type: String, required: true }],
  },
  { timestamps: true }
)

export const Config = model<ConfigDoc>('Config', ConfigSchema)
