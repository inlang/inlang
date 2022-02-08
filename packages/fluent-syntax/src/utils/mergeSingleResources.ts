import { cloneDeep, merge, unionBy } from 'lodash-es';
import { SingleResource } from '../types/singleResource';

export function mergeSingleResources(args: { source: SingleResource; target: SingleResource }): SingleResource {
    // merge mutates the target object, thus copy it
    const target = cloneDeep(args.target);
    const mergedBody = unionBy(target.body, args.source.body, 'id');
    target.body = mergedBody;
    return target;
}
