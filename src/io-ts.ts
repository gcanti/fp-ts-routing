import { RefinementType, ReadonlyType, IntersectionType, InterfaceType, StrictType, PartialType, Props } from 'io-ts'

export interface HasPropsRefinement extends RefinementType<HasProps, any, any, any> {}
export interface HasPropsReadonly extends ReadonlyType<HasProps, any, any, any> {}
export interface HasPropsIntersection extends IntersectionType<Array<HasProps>, any, any, any> {}
export type HasProps =
  | HasPropsRefinement
  | HasPropsReadonly
  | HasPropsIntersection
  | InterfaceType<any, any, any, any>
  | StrictType<any, any, any, any>
  | PartialType<any, any, any, any>

export const getProps = (type: HasProps): Props => {
  switch (type._tag) {
    case 'RefinementType':
    case 'ReadonlyType':
      return getProps(type.type)
    case 'InterfaceType':
    case 'StrictType':
    case 'PartialType':
      return type.props
    case 'IntersectionType':
      return type.types.reduce<Props>((props, type) => Object.assign(props, getProps(type)), {})
  }
}
